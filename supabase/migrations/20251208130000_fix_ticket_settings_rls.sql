-- Fix RLS policy for ticket_settings UPDATE to include WITH CHECK clause
-- This ensures UPDATE operations work correctly with RLS, especially for upsert scenarios

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Admins can update ticket settings" ON public.ticket_settings;

-- Recreate the UPDATE policy with both USING and WITH CHECK clauses
CREATE POLICY "Admins can update ticket settings" 
ON public.ticket_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

