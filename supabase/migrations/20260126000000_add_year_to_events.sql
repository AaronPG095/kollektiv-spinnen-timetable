-- Add year column to events table
ALTER TABLE public.events 
ADD COLUMN year INTEGER NOT NULL DEFAULT 2026;

-- Create index on year for efficient filtering
CREATE INDEX idx_events_year ON public.events(year);

-- Add comment to column
COMMENT ON COLUMN public.events.year IS 'Year of the festival event';
