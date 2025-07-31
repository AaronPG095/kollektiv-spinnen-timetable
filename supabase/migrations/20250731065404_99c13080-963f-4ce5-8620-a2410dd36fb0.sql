-- Add is_visible column to events table
ALTER TABLE public.events 
ADD COLUMN is_visible BOOLEAN NOT NULL DEFAULT true;

-- Update RLS policy for public view to respect visibility
DROP POLICY IF EXISTS "Public can view events" ON public.events;

CREATE POLICY "Public can view visible events" 
ON public.events 
FOR SELECT 
USING (
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN true
    ELSE is_visible = true
  END
);