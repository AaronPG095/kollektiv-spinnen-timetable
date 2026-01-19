-- Quick fix: Add universal limit columns to ticket_settings table
-- Run this in Supabase SQL Editor if migrations haven't been applied

-- Add normal_total_limit column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ticket_settings' 
    AND column_name = 'normal_total_limit'
  ) THEN
    ALTER TABLE public.ticket_settings 
    ADD COLUMN normal_total_limit INTEGER;
  END IF;
END $$;

-- Add early_bird_total_limit column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ticket_settings' 
    AND column_name = 'early_bird_total_limit'
  ) THEN
    ALTER TABLE public.ticket_settings 
    ADD COLUMN early_bird_total_limit INTEGER;
  END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ticket_settings' 
AND column_name IN ('normal_total_limit', 'early_bird_total_limit');
