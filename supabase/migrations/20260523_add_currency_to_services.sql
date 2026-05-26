-- Add currency column to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
