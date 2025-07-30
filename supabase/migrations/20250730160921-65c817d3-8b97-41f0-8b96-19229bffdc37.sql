-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;

-- Create new policy that allows public access to view events
CREATE POLICY "Public can view events" 
ON public.events 
FOR SELECT 
TO public
USING (true);