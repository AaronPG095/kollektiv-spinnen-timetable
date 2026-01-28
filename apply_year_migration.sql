-- Migration: Add year column to events and set existing events to 2025
-- This combines both migrations into a single executable SQL script

-- Step 1: Add year column to events table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'year'
    ) THEN
        ALTER TABLE public.events 
        ADD COLUMN year INTEGER NOT NULL DEFAULT 2026;
        
        -- Create index on year for efficient filtering
        CREATE INDEX idx_events_year ON public.events(year);
        
        -- Add comment to column
        COMMENT ON COLUMN public.events.year IS 'Year of the festival event';
    END IF;
END $$;

-- Step 2: Update all existing events to year 2025
UPDATE public.events 
SET year = 2025
WHERE year = 2026 OR year IS NULL;
