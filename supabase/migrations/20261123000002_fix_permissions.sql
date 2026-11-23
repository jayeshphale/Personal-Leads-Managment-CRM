-- ==============================================================================
-- PERSONAL LEADS MANAGEMENT CRM - SUPABASE PERMISSION & RLS FIX
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/towbkcfeztorohjnukil/sql
-- ==============================================================================

-- 1. Grant full schema and table permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 2. Configure Permissive Row Level Security (RLS) for single-user CRM
-- Ensures both authenticated sessions and publishable key requests can access reminders and data seamlessly

-- Reminders
ALTER TABLE IF EXISTS public.reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Allow owner reminders" ON public.reminders;
CREATE POLICY "Allow owner reminders" ON public.reminders
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Leads
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own leads" ON public.leads;
DROP POLICY IF EXISTS "Allow owner leads" ON public.leads;
CREATE POLICY "Allow owner leads" ON public.leads
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Lead Activities
ALTER TABLE IF EXISTS public.lead_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Allow owner lead activities" ON public.lead_activities;
CREATE POLICY "Allow owner lead activities" ON public.lead_activities
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Packages
ALTER TABLE IF EXISTS public.packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own packages" ON public.packages;
DROP POLICY IF EXISTS "Allow owner packages" ON public.packages;
CREATE POLICY "Allow owner packages" ON public.packages
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Lead Sources
ALTER TABLE IF EXISTS public.lead_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own lead sources" ON public.lead_sources;
DROP POLICY IF EXISTS "Allow owner lead sources" ON public.lead_sources;
CREATE POLICY "Allow owner lead sources" ON public.lead_sources
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Workshops
ALTER TABLE IF EXISTS public.workshops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own workshops" ON public.workshops;
DROP POLICY IF EXISTS "Allow owner workshops" ON public.workshops;
CREATE POLICY "Allow owner workshops" ON public.workshops
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Workshop Registrations
ALTER TABLE IF EXISTS public.workshop_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own workshop registrations" ON public.workshop_registrations;
DROP POLICY IF EXISTS "Allow owner workshop registrations" ON public.workshop_registrations;
CREATE POLICY "Allow owner workshop registrations" ON public.workshop_registrations
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Course Enrollments
ALTER TABLE IF EXISTS public.course_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own course enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Allow owner course enrollments" ON public.course_enrollments;
CREATE POLICY "Allow owner course enrollments" ON public.course_enrollments
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Profiles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow owner profile" ON public.profiles;
CREATE POLICY "Allow owner profile" ON public.profiles
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);
