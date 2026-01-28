-- Change year column from INTEGER to INTEGER[] array to support multiple years per event

-- Step 1: Add a temporary column for the array
ALTER TABLE public.events 
ADD COLUMN year_array INTEGER[];

-- Step 2: Convert existing single year values to arrays in the new column
UPDATE public.events 
SET year_array = ARRAY[year]::INTEGER[]
WHERE year IS NOT NULL;

-- Step 3: Set default for new rows
ALTER TABLE public.events 
ALTER COLUMN year_array SET DEFAULT ARRAY[2026]::INTEGER[];

-- Step 4: Drop the old column
ALTER TABLE public.events 
DROP COLUMN year;

-- Step 5: Rename the new column to year
ALTER TABLE public.events 
RENAME COLUMN year_array TO year;

-- Step 6: Make it NOT NULL (since we've migrated all data)
ALTER TABLE public.events 
ALTER COLUMN year SET NOT NULL;

-- Step 7: Update the comment
COMMENT ON COLUMN public.events.year IS 'Array of years for the festival event (allows events to span multiple years)';

-- Step 8: Drop old index and create GIN index for efficient array queries
DROP INDEX IF EXISTS idx_events_year;
CREATE INDEX idx_events_year_gin ON public.events USING GIN(year);
