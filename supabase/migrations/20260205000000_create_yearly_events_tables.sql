-- Migration: Create yearly events tables and migrate existing data
-- This creates separate tables for each year (events_2025, events_2026, etc.)
-- and migrates events from the main events table to the appropriate yearly tables

-- Function to get events table name for a given year
CREATE OR REPLACE FUNCTION public.get_events_table_name(year_val INTEGER)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT 'events_' || year_val::TEXT;
$$;

-- Function to create a yearly events table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_yearly_events_table(year_val INTEGER)
RETURNS VOID
LANGUAGE PLPGSQL
AS $$
DECLARE
  table_name TEXT;
BEGIN
  table_name := public.get_events_table_name(year_val);
  
  -- Create the table if it doesn't exist
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS public.%I (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      time TEXT NOT NULL,
      venue TEXT NOT NULL,
      day TEXT NOT NULL CHECK (day IN (''Freitag'', ''Samstag'', ''Sonntag'')),
      type TEXT NOT NULL,
      description TEXT,
      links JSONB DEFAULT ''{}'',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      start_time TEXT,
      end_time TEXT,
      is_visible BOOLEAN NOT NULL DEFAULT true
    );
  ', table_name);
  
  -- Enable RLS
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);
  
  -- Create RLS policies
  EXECUTE format('
    DROP POLICY IF EXISTS "Public can view visible events" ON public.%I;
    CREATE POLICY "Public can view visible events" 
    ON public.%I 
    FOR SELECT 
    USING (
      CASE 
        WHEN public.has_role(auth.uid(), ''admin''::app_role) THEN true
        ELSE is_visible = true
      END
    );
  ', table_name, table_name);
  
  EXECUTE format('
    DROP POLICY IF EXISTS "Admins can insert events" ON public.%I;
    CREATE POLICY "Admins can insert events" 
    ON public.%I 
    FOR INSERT 
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role));
  ', table_name, table_name);
  
  EXECUTE format('
    DROP POLICY IF EXISTS "Admins can update events" ON public.%I;
    CREATE POLICY "Admins can update events" 
    ON public.%I 
    FOR UPDATE 
    TO authenticated
    USING (public.has_role(auth.uid(), ''admin''::app_role));
  ', table_name, table_name);
  
  EXECUTE format('
    DROP POLICY IF EXISTS "Admins can delete events" ON public.%I;
    CREATE POLICY "Admins can delete events" 
    ON public.%I 
    FOR DELETE 
    TO authenticated
    USING (public.has_role(auth.uid(), ''admin''::app_role));
  ', table_name, table_name);
  
  -- Create indexes
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS idx_%I_day ON public.%I(day);
    CREATE INDEX IF NOT EXISTS idx_%I_venue ON public.%I(venue);
    CREATE INDEX IF NOT EXISTS idx_%I_type ON public.%I(type);
    CREATE INDEX IF NOT EXISTS idx_%I_is_visible ON public.%I(is_visible) WHERE is_visible = true;
    CREATE INDEX IF NOT EXISTS idx_%I_start_time ON public.%I(start_time);
  ', 
    table_name, table_name,
    table_name, table_name,
    table_name, table_name,
    table_name, table_name,
    table_name, table_name
  );
  
  -- Create trigger for updated_at
  EXECUTE format('
    DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
    CREATE TRIGGER update_%I_updated_at
    BEFORE UPDATE ON public.%I
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  ', table_name, table_name, table_name, table_name);
END;
$$;

-- Create tables for years 2025 and 2026 (and any other years found in existing events)
DO $$
DECLARE
  year_val INTEGER;
  years_found INTEGER[];
BEGIN
  -- Get all unique years from existing events
  SELECT ARRAY_AGG(DISTINCT unnest_year) INTO years_found
  FROM (
    SELECT unnest(years) as unnest_year
    FROM public.events
  ) subq;
  
  -- If no years found, default to current year and next year
  IF years_found IS NULL OR array_length(years_found, 1) IS NULL THEN
    years_found := ARRAY[EXTRACT(YEAR FROM now())::INTEGER, (EXTRACT(YEAR FROM now()) + 1)::INTEGER];
  END IF;
  
  -- Create tables for each year found
  FOREACH year_val IN ARRAY years_found
  LOOP
    PERFORM public.create_yearly_events_table(year_val);
  END LOOP;
END $$;

-- Migrate existing events to yearly tables
-- Events with multiple years in the array will be duplicated to each year's table
DO $$
DECLARE
  event_record RECORD;
  year_val INTEGER;
  table_name TEXT;
  new_id UUID;
BEGIN
  FOR event_record IN 
    SELECT * FROM public.events
  LOOP
    -- For each year in the event's years array, insert into that year's table
    FOREACH year_val IN ARRAY event_record.years
    LOOP
      table_name := public.get_events_table_name(year_val);
      
      -- Insert event into the appropriate yearly table
      -- Generate new ID for each year (events can have different data per year)
      EXECUTE format('
        INSERT INTO public.%I (
          title, time, venue, day, type, description, links,
          start_time, end_time, is_visible, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      ', table_name)
      USING 
        event_record.title,
        event_record.time,
        event_record.venue,
        event_record.day,
        event_record.type,
        event_record.description,
        COALESCE(event_record.links, '{}'::jsonb),
        event_record.start_time,
        event_record.end_time,
        event_record.is_visible,
        event_record.created_at,
        event_record.updated_at
      INTO new_id;
    END LOOP;
  END LOOP;
END $$;

-- Add comment to document the migration
COMMENT ON FUNCTION public.get_events_table_name(INTEGER) IS 'Returns the table name for events of a given year (e.g., events_2025)';
COMMENT ON FUNCTION public.create_yearly_events_table(INTEGER) IS 'Creates a yearly events table with all necessary RLS policies, indexes, and triggers';
