-- Optimize multiple permissive policies by combining them where possible
-- Multiple permissive policies cause performance overhead as each must be executed

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Combine "Users can view own profile" and "Admins can view all profiles" into one policy

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users and admins can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Users can view their own profile
  ((select auth.uid()) = id)
  OR
  -- Admins can view all profiles
  ((select public.has_role((select auth.uid()), 'admin'::app_role)))
);

-- ============================================================================
-- TICKET_PURCHASES TABLE
-- ============================================================================
-- Combine "Public can view confirmed purchases" and "Users can view own purchases"
-- Note: These are for different roles (public vs authenticated), so we keep them separate
-- but optimize the authenticated one

-- The public policy is fine as-is (different role)
-- Just ensure the authenticated policy is optimized (already done in previous migration)

-- ============================================================================
-- USER_ROLES TABLE
-- ============================================================================
-- Combine "Admins can view all roles" into "Admins can manage roles" since it's already ALL

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- The "Admins can manage roles" policy already covers SELECT, so we don't need a separate one
-- But let's make sure it's properly set up
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

