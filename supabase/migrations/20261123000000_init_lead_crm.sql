-- ==============================================================================
-- PERSONAL LEAD MANAGEMENT CRM - INITIAL DATABASE MIGRATION
-- Production-ready schema with strict RLS, composite foreign keys for ownership,
-- automated owner package & source provisioning, and performance indexes.
-- ==============================================================================

-- 1. Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Packages Table (Standard, Prime, Infinity, Legacy)
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (name IN ('Standard', 'Prime', 'Infinity', 'Legacy')),
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT packages_owner_name_unique UNIQUE (owner_id, name),
    CONSTRAINT packages_id_owner_unique UNIQUE (id, owner_id)
);

-- 4. Lead Sources Table
CREATE TABLE IF NOT EXISTS public.lead_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lead_sources_owner_name_unique UNIQUE (owner_id, name),
    CONSTRAINT lead_sources_id_owner_unique UNIQUE (id, owner_id)
);

-- 5. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL,
    alternate_phone TEXT DEFAULT '',
    active_calling_no TEXT DEFAULT '',
    age INTEGER,
    city TEXT DEFAULT '',
    qualification TEXT NOT NULL DEFAULT 'Other' CHECK (
        qualification IN (
            'Undergraduate Student',
            'High School / 12th Pass',
            'Graduate / Postgraduate',
            'Working Professional',
            'Other'
        )
    ),
    occupation TEXT DEFAULT '',
    lead_source TEXT NOT NULL DEFAULT 'Direct',
    notes TEXT DEFAULT '',
    interest_status TEXT NOT NULL DEFAULT 'New' CHECK (
        interest_status IN (
            'New',
            'Interested',
            'High Intent',
            'Follow Up',
            'Not Interested',
            'Converted',
            'Junk'
        )
    ),
    call_status TEXT NOT NULL DEFAULT 'Not Called' CHECK (
        call_status IN (
            'Not Called',
            'Connected',
            'No Answer',
            'Busy',
            'Invalid Number'
        )
    ),
    whatsapp_status TEXT NOT NULL DEFAULT 'Not Sent' CHECK (
        whatsapp_status IN (
            'Not Sent',
            'Sent',
            'Replied'
        )
    ),
    closing_status TEXT NOT NULL DEFAULT 'Not Scheduled' CHECK (
        closing_status IN (
            'Not Scheduled',
            'Scheduled',
            'Completed',
            'Follow-up Required'
        )
    ),
    closing_notes TEXT DEFAULT '',
    next_follow_up_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT leads_id_owner_unique UNIQUE (id, owner_id)
);

-- 6. Lead Activities Table (Full historical logging)
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Enforce ownership consistency between parent lead and activity at DB level
    CONSTRAINT fk_lead_activities_lead_owner FOREIGN KEY (lead_id, owner_id)
        REFERENCES public.leads(id, owner_id) ON DELETE CASCADE
);

-- 7. Reminders Table
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    due_date DATE NOT NULL,
    due_time TIME NOT NULL DEFAULT '10:00:00',
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Optional composite check if lead_id is present
    CONSTRAINT fk_reminders_lead_owner FOREIGN KEY (lead_id, owner_id)
        REFERENCES public.leads(id, owner_id) ON DELETE CASCADE
);

-- 8. Workshops Table
CREATE TABLE IF NOT EXISTS public.workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    workshop_date TIMESTAMPTZ NOT NULL,
    location_or_link TEXT DEFAULT 'Online (Zoom / Meet)',
    status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Ongoing', 'Completed', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT workshops_id_owner_unique UNIQUE (id, owner_id)
);

-- 9. Workshop Registrations Table
CREATE TABLE IF NOT EXISTS public.workshop_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workshop_id UUID NOT NULL,
    lead_id UUID NOT NULL,
    attendance_status TEXT NOT NULL DEFAULT 'Pending' CHECK (attendance_status IN ('Pending', 'Attended', 'Absent')),
    attendance_date TIMESTAMPTZ,
    notes TEXT DEFAULT '',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Enforce ownership consistency at DB level
    CONSTRAINT fk_workshop_reg_workshop_owner FOREIGN KEY (workshop_id, owner_id)
        REFERENCES public.workshops(id, owner_id) ON DELETE CASCADE,
    CONSTRAINT fk_workshop_reg_lead_owner FOREIGN KEY (lead_id, owner_id)
        REFERENCES public.leads(id, owner_id) ON DELETE CASCADE,
    CONSTRAINT workshop_registrations_unique UNIQUE (workshop_id, lead_id)
);

-- 10. Course Enrollments Table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,
    package_id UUID,
    package_name TEXT NOT NULL CHECK (package_name IN ('Standard', 'Prime', 'Infinity', 'Legacy')),
    enrollment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partial', 'Paid', 'Refunded')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Enforce ownership consistency at DB level
    CONSTRAINT fk_course_enrollments_lead_owner FOREIGN KEY (lead_id, owner_id)
        REFERENCES public.leads(id, owner_id) ON DELETE CASCADE,
    CONSTRAINT fk_course_enrollments_package_owner FOREIGN KEY (package_id, owner_id)
        REFERENCES public.packages(id, owner_id) ON DELETE SET NULL
);

-- ==============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ==============================================================================
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workshops_updated_at BEFORE UPDATE ON public.workshops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- AUTOMATIC USER PROVISIONING TRIGGER & SEED FUNCTION
-- Automatically provisions profile, 4 default packages & lead sources on sign-up
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_provisioning()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Create Profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Seed the 4 packages required for this owner
    INSERT INTO public.packages (owner_id, name, description, price)
    VALUES
        (NEW.id, 'Standard', 'Entry level training program with core curriculum and community access.', 4999.00),
        (NEW.id, 'Prime', 'Advanced training program with live sessions and mentor support.', 9999.00),
        (NEW.id, 'Infinity', 'Comprehensive masterclass with 1-on-1 mentorship and certification.', 19999.00),
        (NEW.id, 'Legacy', 'Full access lifetime program with direct advisory and career placement assistance.', 34999.00)
    ON CONFLICT (owner_id, name) DO NOTHING;

    -- 3. Seed default lead sources
    INSERT INTO public.lead_sources (owner_id, name)
    VALUES
        (NEW.id, 'Website'),
        (NEW.id, 'Instagram'),
        (NEW.id, 'Facebook Ad'),
        (NEW.id, 'Google Search'),
        (NEW.id, 'Referral'),
        (NEW.id, 'Webinar'),
        (NEW.id, 'Direct')
    ON CONFLICT (owner_id, name) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_provisioning();

-- Idempotent manual initialization RPC for the currently signed-in user
CREATE OR REPLACE FUNCTION public.initialize_owner_account()
RETURNS jsonb AS $$
DECLARE
    v_uid UUID;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Ensure profile exists
    INSERT INTO public.profiles (id, email)
    SELECT id, email FROM auth.users WHERE id = v_uid
    ON CONFLICT (id) DO NOTHING;

    -- Ensure packages exist
    INSERT INTO public.packages (owner_id, name, description, price)
    VALUES
        (v_uid, 'Standard', 'Entry level training program with core curriculum and community access.', 4999.00),
        (v_uid, 'Prime', 'Advanced training program with live sessions and mentor support.', 9999.00),
        (v_uid, 'Infinity', 'Comprehensive masterclass with 1-on-1 mentorship and certification.', 19999.00),
        (v_uid, 'Legacy', 'Full access lifetime program with direct advisory and career placement assistance.', 34999.00)
    ON CONFLICT (owner_id, name) DO NOTHING;

    -- Ensure sources exist
    INSERT INTO public.lead_sources (owner_id, name)
    VALUES
        (v_uid, 'Website'),
        (v_uid, 'Instagram'),
        (v_uid, 'Facebook Ad'),
        (v_uid, 'Google Search'),
        (v_uid, 'Referral'),
        (v_uid, 'Webinar'),
        (v_uid, 'Direct')
    ON CONFLICT (owner_id, name) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'owner_id', v_uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Profiles: user can view and edit their own profile
CREATE POLICY "Users can manage their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Packages
CREATE POLICY "Users can manage their own packages" ON public.packages
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Lead Sources
CREATE POLICY "Users can manage their own lead sources" ON public.lead_sources
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Leads
CREATE POLICY "Users can manage their own leads" ON public.leads
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Lead Activities
CREATE POLICY "Users can manage their own lead activities" ON public.lead_activities
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Reminders
CREATE POLICY "Users can manage their own reminders" ON public.reminders
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Workshops
CREATE POLICY "Users can manage their own workshops" ON public.workshops
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Workshop Registrations
CREATE POLICY "Users can manage their own workshop registrations" ON public.workshop_registrations
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Course Enrollments
CREATE POLICY "Users can manage their own course enrollments" ON public.course_enrollments
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ==============================================================================
-- PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_owner_created ON public.leads(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_owner_phone ON public.leads(owner_id, phone);
CREATE INDEX IF NOT EXISTS idx_leads_owner_interest ON public.leads(owner_id, interest_status);
CREATE INDEX IF NOT EXISTS idx_leads_owner_call ON public.leads(owner_id, call_status);
CREATE INDEX IF NOT EXISTS idx_leads_owner_whatsapp ON public.leads(owner_id, whatsapp_status);
CREATE INDEX IF NOT EXISTS idx_leads_owner_followup ON public.leads(owner_id, next_follow_up_date);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_owner ON public.lead_activities(owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reminders_owner_due ON public.reminders(owner_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_reminders_lead ON public.reminders(lead_id);

CREATE INDEX IF NOT EXISTS idx_workshops_owner_date ON public.workshops(owner_id, workshop_date DESC);
CREATE INDEX IF NOT EXISTS idx_workshop_reg_workshop ON public.workshop_registrations(workshop_id, attendance_status);
CREATE INDEX IF NOT EXISTS idx_workshop_reg_lead ON public.workshop_registrations(lead_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_owner ON public.course_enrollments(owner_id, enrollment_date DESC);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_lead ON public.course_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_package ON public.course_enrollments(package_name, payment_status);
