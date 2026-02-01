-- Add super_admin role and restrict admin management to super admins only
-- This migration:
-- 1. Adds 'super_admin' to app_role enum
-- 2. Creates is_super_admin() function to check if user is aaron.p.greyling@gmail.com
-- 3. Updates RLS policies to restrict admin management to super admins
-- 4. Grants super_admin role to aaron.p.greyling@gmail.com

-- Step 1: Add 'super_admin' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Step 2: Create function to check if current user is super admin
-- Super admin is exclusively aaron.p.greyling@gmail.com
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the current user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Check if email matches super admin email (case-insensitive, trimmed)
  RETURN LOWER(TRIM(COALESCE(user_email, ''))) = 'aaron.p.greyling@gmail.com';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Step 3: Update RLS policies for user_roles table
-- Keep SELECT policy for admins (so they can view roles)
-- Restrict INSERT/UPDATE/DELETE to super admins only

-- Drop existing policies that allow admins to manage roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Keep SELECT policy for admins (view only)
-- This policy should already exist, but ensure it's correct
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- Create new policies that restrict management to super admins only
CREATE POLICY "Super admins can insert roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can delete roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (public.is_super_admin());

-- Step 4: Update RLS policies for admin_emails table
-- Keep SELECT policy public (needed for admin status checks)
-- Restrict INSERT/UPDATE/DELETE to super admins only

-- Drop existing policies that allow admins to manage admin emails
DROP POLICY IF EXISTS "Admins can insert admin emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can update admin emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can delete admin emails" ON public.admin_emails;

-- Keep SELECT policy public (already exists, but ensure it's there)
DROP POLICY IF EXISTS "Public can view admin emails" ON public.admin_emails;
CREATE POLICY "Public can view admin emails" 
ON public.admin_emails 
FOR SELECT 
TO public
USING (true);

-- Create new policies that restrict management to super admins only
CREATE POLICY "Super admins can insert admin emails" 
ON public.admin_emails 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update admin emails" 
ON public.admin_emails 
FOR UPDATE 
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can delete admin emails" 
ON public.admin_emails 
FOR DELETE 
TO authenticated
USING (public.is_super_admin());

-- Step 5: Grant super_admin role to aaron.p.greyling@gmail.com
-- Note: This must be done in a separate transaction after the enum is committed
-- The role will be granted via a separate SQL execution after this migration
