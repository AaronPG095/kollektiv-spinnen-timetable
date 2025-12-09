-- First drop the existing CHECK constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_day_check;

-- Update day values to match the frontend interface (German names)
UPDATE public.events SET day = 'Freitag' WHERE day = 'Friday';
UPDATE public.events SET day = 'Samstag' WHERE day = 'Saturday'; 
UPDATE public.events SET day = 'Sonntag' WHERE day = 'Sunday';

-- Add the new CHECK constraint with German day names
ALTER TABLE public.events ADD CONSTRAINT events_day_check CHECK (day IN ('Freitag', 'Samstag', 'Sonntag'));