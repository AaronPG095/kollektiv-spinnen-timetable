-- Add notes column to soli_contribution_settings table
ALTER TABLE public.soli_contribution_settings 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.soli_contribution_settings.notes IS 'Admin notes for Soli-Contribution settings. Autosaves as user types.';
