-- Ensure public (anonymous) users can view visible events
-- This migration fixes any RLS policy issues that might prevent anonymous access

-- Drop all existing SELECT policies on events table
DO $$
BEGIN
  -- Drop all existing policies
  DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
  DROP POLICY IF EXISTS "Public can view events" ON public.events;
  DROP POLICY IF EXISTS "Public can view visible events" ON public.events;
  
  -- Create a single, clear policy that allows:
  -- 1. Anonymous users to see events where is_visible = true
  -- 2. Authenticated admin users to see all events
  CREATE POLICY "Public can view visible events" 
  ON public.events 
  FOR SELECT 
  TO public
  USING (
    -- If user is authenticated and is admin, show all events
    (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role))
    OR
    -- Otherwise, only show visible events
    (is_visible = true)
  );
  
  RAISE NOTICE 'RLS policy for events table updated successfully';
END $$;

