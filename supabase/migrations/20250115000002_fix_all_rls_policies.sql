-- Fix RLS policies for all tables to ensure anonymous/public access works correctly
-- This migration ensures that all tables can be accessed by anonymous users where appropriate

-- Fix FAQs policy to explicitly allow public/anonymous access
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
    -- Drop existing policy
    DROP POLICY IF EXISTS "Public can view visible FAQs" ON public.faqs;
    
    -- Create policy that explicitly allows anonymous users
    CREATE POLICY "Public can view visible FAQs" 
    ON public.faqs 
    FOR SELECT 
    TO public
    USING (
      CASE
        WHEN auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role) THEN true
        ELSE (is_visible = true)
      END
    );
    
    RAISE NOTICE 'FAQs RLS policy updated';
  END IF;
END $$;

-- Ensure ticket_settings policy allows public access
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ticket_settings') THEN
    -- Drop existing policy
    DROP POLICY IF EXISTS "Public can view ticket settings" ON public.ticket_settings;
    
    -- Create policy that explicitly allows anonymous users
    CREATE POLICY "Public can view ticket settings" 
    ON public.ticket_settings 
    FOR SELECT 
    TO public
    USING (true);
    
    RAISE NOTICE 'Ticket settings RLS policy updated';
  END IF;
END $$;

-- Ensure ticket_purchases policy allows public access to confirmed purchases
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ticket_purchases') THEN
    -- Drop existing policy
    DROP POLICY IF EXISTS "Public can view confirmed purchases" ON public.ticket_purchases;
    
    -- Create policy that explicitly allows anonymous users to see confirmed purchases
    CREATE POLICY "Public can view confirmed purchases" 
    ON public.ticket_purchases 
    FOR SELECT 
    TO public
    USING (status = 'confirmed');
    
    RAISE NOTICE 'Ticket purchases RLS policy updated';
  END IF;
END $$;

-- Ensure about_page_content policy allows public access
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'about_page_content') THEN
    -- Drop existing policy
    DROP POLICY IF EXISTS "Public can view about page content" ON public.about_page_content;
    
    -- Create policy that explicitly allows anonymous users
    CREATE POLICY "Public can view about page content" 
    ON public.about_page_content 
    FOR SELECT 
    TO public
    USING (true);
    
    RAISE NOTICE 'About page content RLS policy updated';
  END IF;
END $$;

-- Ensure about_page_photos policy allows public access
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'about_page_photos') THEN
    -- Drop existing policy
    DROP POLICY IF EXISTS "Public can view about page photos" ON public.about_page_photos;
    
    -- Create policy that explicitly allows anonymous users
    CREATE POLICY "Public can view about page photos" 
    ON public.about_page_photos 
    FOR SELECT 
    TO public
    USING (true);
    
    RAISE NOTICE 'About page photos RLS policy updated';
  END IF;
END $$;

