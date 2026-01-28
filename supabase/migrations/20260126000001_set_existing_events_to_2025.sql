-- Update all existing events to year 2025
-- This updates all events that were created before the year column was added
UPDATE public.events 
SET year = 2025;
