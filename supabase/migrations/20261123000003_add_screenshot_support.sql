-- ==============================================================================
-- PERSONAL LEADS MANAGEMENT CRM - ADD SCREENSHOT & IMAGE ATTACHMENTS
-- Run this in your Supabase SQL Editor if you want to store screenshots in PostgreSQL:
-- https://supabase.com/dashboard/project/towbkcfeztorohjnukil/sql
-- ==============================================================================

ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS notes_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.leads ADD COLUMN IF NOT EXISTS closing_notes_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.lead_activities ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.course_enrollments ADD COLUMN IF NOT EXISTS receipt_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.workshop_registrations ADD COLUMN IF NOT EXISTS receipt_images JSONB DEFAULT '[]'::jsonb;
