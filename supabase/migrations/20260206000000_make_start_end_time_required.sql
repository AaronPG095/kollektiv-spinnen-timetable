-- Migration: Make start_time and end_time required, make time nullable
-- This migration updates all yearly events tables to require start_time and end_time
-- while making the time field nullable (it will be auto-generated from start_time/end_time)

-- Function to update a yearly events table
CREATE OR REPLACE FUNCTION public.update_yearly_table_time_constraints(table_name TEXT)
RETURNS VOID
LANGUAGE PLPGSQL
AS $$
BEGIN
  -- First, ensure all events have start_time and end_time populated
  -- If missing, try to parse from time field
  EXECUTE format('
    UPDATE public.%I
    SET 
      start_time = COALESCE(
        start_time,
        CASE 
          WHEN time IS NOT NULL AND time LIKE ''%%-%%'' THEN TRIM(SPLIT_PART(time, ''-'', 1))
          WHEN time IS NOT NULL THEN time
          ELSE ''19:00''
        END
      ),
      end_time = COALESCE(
        end_time,
        CASE 
          WHEN time IS NOT NULL AND time LIKE ''%%-%%'' THEN TRIM(SPLIT_PART(time, ''-'', 2))
          WHEN time IS NOT NULL THEN time
          ELSE ''20:00''
        END
      )
    WHERE start_time IS NULL OR end_time IS NULL;
  ', table_name);
  
  -- Now make start_time and end_time NOT NULL
  EXECUTE format('ALTER TABLE public.%I ALTER COLUMN start_time SET NOT NULL;', table_name);
  EXECUTE format('ALTER TABLE public.%I ALTER COLUMN end_time SET NOT NULL;', table_name);
  
  -- Make time nullable (it will be auto-generated)
  EXECUTE format('ALTER TABLE public.%I ALTER COLUMN time DROP NOT NULL;', table_name);
END;
$$;

-- Update all existing yearly events tables
DO $$
DECLARE
  table_record RECORD;
  table_name TEXT;
BEGIN
  -- Find all yearly events tables (events_YYYY format)
  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename ~ '^events_[0-9]{4}$'
  LOOP
    table_name := table_record.tablename;
    RAISE NOTICE 'Updating table: %', table_name;
    PERFORM public.update_yearly_table_time_constraints(table_name);
  END LOOP;
END $$;

-- Also update the main events table if it exists and has the columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'events' 
      AND column_name = 'start_time'
  ) THEN
    -- Ensure all events have start_time and end_time
    UPDATE public.events
    SET 
      start_time = COALESCE(
        start_time,
        CASE 
          WHEN time IS NOT NULL AND time LIKE '%-%' THEN TRIM(SPLIT_PART(time, '-', 1))
          WHEN time IS NOT NULL THEN time
          ELSE '19:00'
        END
      ),
      end_time = COALESCE(
        end_time,
        CASE 
          WHEN time IS NOT NULL AND time LIKE '%-%' THEN TRIM(SPLIT_PART(time, '-', 2))
          WHEN time IS NOT NULL THEN time
          ELSE '20:00'
        END
      )
    WHERE start_time IS NULL OR end_time IS NULL;
    
    -- Make start_time and end_time NOT NULL
    ALTER TABLE public.events ALTER COLUMN start_time SET NOT NULL;
    ALTER TABLE public.events ALTER COLUMN end_time SET NOT NULL;
    
    -- Make time nullable
    ALTER TABLE public.events ALTER COLUMN time DROP NOT NULL;
  END IF;
END $$;

-- Clean up the helper function
DROP FUNCTION IF EXISTS public.update_yearly_table_time_constraints(TEXT);
