-- Add admin SELECT policy for soli_contribution_purchases
-- This allows admins to view all purchases regardless of status

CREATE POLICY "Admins can view all soli contribution purchases" 
ON public.soli_contribution_purchases 
FOR SELECT 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));
