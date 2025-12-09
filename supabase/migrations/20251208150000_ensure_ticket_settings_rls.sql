-- Ensure ticket_settings RLS policies are correct for both INSERT and UPDATE
-- This migration ensures admins can both insert and update ticket settings

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert ticket settings" ON public.ticket_settings;
DROP POLICY IF EXISTS "Admins can update ticket settings" ON public.ticket_settings;

-- Recreate INSERT policy with proper WITH CHECK clause
CREATE POLICY "Admins can insert ticket settings" 
ON public.ticket_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Recreate UPDATE policy with both USING and WITH CHECK clauses
CREATE POLICY "Admins can update ticket settings" 
ON public.ticket_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

