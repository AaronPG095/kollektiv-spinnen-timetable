-- Add notes column to ticket_settings table
-- (Table is renamed to soli_contribution_settings in 20260119120000)
ALTER TABLE public.ticket_settings
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.ticket_settings.notes IS 'Admin notes for Soli-Contribution settings. Autosaves as user types.';
