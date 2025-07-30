-- Add startTime and endTime columns to events table
ALTER TABLE public.events 
ADD COLUMN start_time TEXT,
ADD COLUMN end_time TEXT;

-- Update existing events to split time field into start_time and end_time
UPDATE public.events 
SET 
  start_time = TRIM(SPLIT_PART(time, '-', 1)),
  end_time = TRIM(SPLIT_PART(time, '-', 2))
WHERE time IS NOT NULL AND time LIKE '%-%';

-- Handle events without time ranges (single time entries)
UPDATE public.events 
SET 
  start_time = time,
  end_time = time
WHERE time IS NOT NULL AND time NOT LIKE '%-%' AND start_time IS NULL;

-- Set default values for any remaining null entries
UPDATE public.events 
SET 
  start_time = '19:00',
  end_time = '20:00'
WHERE start_time IS NULL OR end_time IS NULL;