-- FIX: admin_emails infinite recursion in RLS policy
-- Run this in Supabase Dashboard → SQL Editor

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage admin emails" ON public.admin_emails;

-- Create separate policies that use user_roles (not admin_emails) to avoid recursion
CREATE POLICY IF NOT EXISTS "Admins can insert admin emails" 
ON public.admin_emails 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "Admins can update admin emails" 
ON public.admin_emails 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "Admins can delete admin emails" 
ON public.admin_emails 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

