-- Optimize RLS policies for better performance
-- This migration wraps auth.uid() and has_role() calls in SELECT subqueries
-- to prevent re-evaluation for each row, improving query performance at scale

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================

-- Optimize "Public can view visible events" policy
DROP POLICY IF EXISTS "Public can view visible events" ON public.events;
CREATE POLICY "Public can view visible events" 
ON public.events 
FOR SELECT 
TO public
USING (
  -- If user is authenticated and is admin, show all events
  ((select auth.uid()) IS NOT NULL AND (select public.has_role((select auth.uid()), 'admin'::app_role)))
  OR
  -- Otherwise, only show visible events
  (is_visible = true)
);

-- Optimize "Admins can insert events" policy
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
CREATE POLICY "Admins can insert events" 
ON public.events 
FOR INSERT 
TO authenticated
WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- Optimize "Admins can update events" policy
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events" 
ON public.events 
FOR UPDATE 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- Optimize "Admins can delete events" policy
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events" 
ON public.events 
FOR DELETE 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ============================================================================
-- FAQS TABLE
-- ============================================================================

-- Optimize "Public can view visible FAQs" policy
DROP POLICY IF EXISTS "Public can view visible FAQs" ON public.faqs;
CREATE POLICY "Public can view visible FAQs" 
ON public.faqs 
FOR SELECT 
TO public
USING (
  CASE
    WHEN (select auth.uid()) IS NOT NULL AND (select public.has_role((select auth.uid()), 'admin'::app_role)) THEN true
    ELSE (is_visible = true)
  END
);

-- Optimize "Admins can insert FAQs" policy
DROP POLICY IF EXISTS "Admins can insert FAQs" ON public.faqs;
CREATE POLICY "Admins can insert FAQs" 
ON public.faqs 
FOR INSERT 
TO authenticated
WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- Optimize "Admins can update FAQs" policy
DROP POLICY IF EXISTS "Admins can update FAQs" ON public.faqs;
CREATE POLICY "Admins can update FAQs" 
ON public.faqs 
FOR UPDATE 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- Optimize "Admins can delete FAQs" policy
DROP POLICY IF EXISTS "Admins can delete FAQs" ON public.faqs;
CREATE POLICY "Admins can delete FAQs" 
ON public.faqs 
FOR DELETE 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ============================================================================
-- TICKET_SETTINGS TABLE
-- ============================================================================

-- Optimize "Admins can insert ticket settings" policy
DROP POLICY IF EXISTS "Admins can insert ticket settings" ON public.ticket_settings;
CREATE POLICY "Admins can insert ticket settings" 
ON public.ticket_settings 
FOR INSERT 
TO authenticated
WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- Optimize "Admins can update ticket settings" policy
DROP POLICY IF EXISTS "Admins can update ticket settings" ON public.ticket_settings;
CREATE POLICY "Admins can update ticket settings" 
ON public.ticket_settings 
FOR UPDATE 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ============================================================================
-- TICKET_PURCHASES TABLE
-- ============================================================================

-- Optimize "Users can view own purchases" policy
DROP POLICY IF EXISTS "Users can view own purchases" ON public.ticket_purchases;
CREATE POLICY "Users can view own purchases" 
ON public.ticket_purchases 
FOR SELECT 
TO authenticated
USING ((select auth.uid()) = user_id OR user_id IS NULL);

-- Optimize "Admins can update purchases" policy
DROP POLICY IF EXISTS "Admins can update purchases" ON public.ticket_purchases;
CREATE POLICY "Admins can update purchases" 
ON public.ticket_purchases 
FOR UPDATE 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- Optimize "Admins can delete purchases" policy
DROP POLICY IF EXISTS "Admins can delete purchases" ON public.ticket_purchases;
CREATE POLICY "Admins can delete purchases" 
ON public.ticket_purchases 
FOR DELETE 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ============================================================================
-- ABOUT_PAGE_CONTENT TABLE
-- ============================================================================

-- Optimize "Admins can insert about page content" policy
DROP POLICY IF EXISTS "Admins can insert about page content" ON public.about_page_content;
CREATE POLICY "Admins can insert about page content" 
ON public.about_page_content 
FOR INSERT 
TO authenticated
WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- Optimize "Admins can update about page content" policy
DROP POLICY IF EXISTS "Admins can update about page content" ON public.about_page_content;
CREATE POLICY "Admins can update about page content" 
ON public.about_page_content 
FOR UPDATE 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ============================================================================
-- ABOUT_PAGE_PHOTOS TABLE
-- ============================================================================

-- Optimize "Admins can insert about page photos" policy
DROP POLICY IF EXISTS "Admins can insert about page photos" ON public.about_page_photos;
CREATE POLICY "Admins can insert about page photos" 
ON public.about_page_photos 
FOR INSERT 
TO authenticated
WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- Optimize "Admins can update about page photos" policy
DROP POLICY IF EXISTS "Admins can update about page photos" ON public.about_page_photos;
CREATE POLICY "Admins can update about page photos" 
ON public.about_page_photos 
FOR UPDATE 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- Optimize "Admins can delete about page photos" policy
DROP POLICY IF EXISTS "Admins can delete about page photos" ON public.about_page_photos;
CREATE POLICY "Admins can delete about page photos" 
ON public.about_page_photos 
FOR DELETE 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ============================================================================
-- USER_ROLES TABLE
-- ============================================================================

-- Optimize "Admins can view all roles" policy
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- Optimize "Admins can manage roles" policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)))
WITH CHECK ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

-- Optimize "Users can view own profile" policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING ((select auth.uid()) = id);

-- Optimize "Users can update own profile" policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING ((select auth.uid()) = id);

-- Optimize "Admins can view all profiles" policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING ((select public.has_role((select auth.uid()), 'admin'::app_role)));

-- ============================================================================
-- ADMIN_EMAILS TABLE
-- ============================================================================

-- Optimize admin_emails policies (use user_roles to avoid recursion)
DROP POLICY IF EXISTS "Admins can insert admin emails" ON public.admin_emails;
CREATE POLICY "Admins can insert admin emails" 
ON public.admin_emails 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update admin emails" ON public.admin_emails;
CREATE POLICY "Admins can update admin emails" 
ON public.admin_emails 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete admin emails" ON public.admin_emails;
CREATE POLICY "Admins can delete admin emails" 
ON public.admin_emails 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  )
);

