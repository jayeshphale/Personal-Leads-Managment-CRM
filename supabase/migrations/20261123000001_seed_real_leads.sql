-- ==============================================================================
-- SEED SCRIPT: REAL CANDIDATE LEADS
-- Run this in your Supabase SQL editor:
-- https://supabase.com/dashboard/project/towbkcfeztorohjnukil/sql
-- ==============================================================================

DO $$
DECLARE
    v_owner_id UUID;
BEGIN
    -- Select the first registered owner
    SELECT id INTO v_owner_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

    IF v_owner_id IS NOT NULL THEN
        -- Remove previous test leads for this owner
        DELETE FROM public.leads WHERE owner_id = v_owner_id;

        -- Insert the 10 candidate leads provided
        INSERT INTO public.leads (
            owner_id,
            first_name,
            last_name,
            phone,
            active_calling_no,
            qualification,
            age,
            city,
            lead_source,
            interest_status,
            call_status,
            whatsapp_status
        )
        VALUES
            (v_owner_id, 'Divya', 'Bidkar', '9021614426', '919021614426', 'Graduate / Postgraduate', 23, 'Pune', 'Instagram', 'New', 'Not Called', 'Not Sent'),
            (v_owner_id, 'Tanuja', 'Tanpure', '7758980042', '917758980042', 'Undergraduate Student', 22, 'Mumbai', 'Instagram', 'New', 'Not Called', 'Not Sent'),
            (v_owner_id, 'Rohit', 'Katte', '7517202932', '7517202932', 'Graduate / Postgraduate', 24, 'Kolhapur', 'Direct', 'Interested', 'Connected', 'Sent'),
            (v_owner_id, 'Md', 'Ekramul', '8777694514', '918777694514', 'Working Professional', 26, 'Kolkata', 'Google Search', 'High Intent', 'Connected', 'Replied'),
            (v_owner_id, 'Naved', 'Sayyed', '7030107074', '917030107074', 'Undergraduate Student', 21, 'Nashik', 'Instagram', 'New', 'Not Called', 'Not Sent'),
            (v_owner_id, 'Pooja', 'Shinde', '9004297316', '9004297316', 'Working Professional', 25, 'Thane', 'Referral', 'Interested', 'Connected', 'Replied'),
            (v_owner_id, 'Utkarsha', 'patil', '9225249237', '9225249237', 'Graduate / Postgraduate', 23, 'Satara', 'Instagram', 'New', 'Not Called', 'Not Sent'),
            (v_owner_id, 'Vedika', 'Jadhav', '9975242756', '919975242756', 'Undergraduate Student', 22, 'Pune', 'Instagram', 'New', 'Not Called', 'Not Sent'),
            (v_owner_id, '§@kuu_05_', 'Khadke', '9209372317', '919209372317', 'Other', 20, 'Aurangabad', 'Instagram', 'New', 'Not Called', 'Not Sent'),
            (v_owner_id, 'Ganu', 'Kumbhar', '7385255201', '917385255201', 'Graduate / Postgraduate', 24, 'Solapur', 'Direct', 'Interested', 'Not Called', 'Not Sent');

        -- Log initial activity for each lead
        INSERT INTO public.lead_activities (owner_id, lead_id, activity_type, new_value, notes)
        SELECT owner_id, id, 'Lead Created', first_name || ' ' || last_name, 'Source: ' || lead_source
        FROM public.leads
        WHERE owner_id = v_owner_id;

        RAISE NOTICE 'Successfully seeded 10 real leads for owner: %', v_owner_id;
    ELSE
        RAISE NOTICE 'No owner found in auth.users yet. Please create an owner user in Supabase Auth first.';
    END IF;
END $$;
