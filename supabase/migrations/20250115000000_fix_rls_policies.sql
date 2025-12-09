-- Fix RLS policies to explicitly allow anonymous users
-- This migration ensures that public (anonymous) users can view visible events and FAQs

-- Only run if events table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    -- Fix events RLS policy to explicitly allow public access
    DROP POLICY IF EXISTS "Public can view visible events" ON public.events;

    CREATE POLICY "Public can view visible events" 
    ON public.events 
    FOR SELECT 
    TO public
    USING (
      CASE 
        WHEN auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role) THEN true
        ELSE is_visible = true
      END
    );
  END IF;
END $$;

-- Only run if faqs table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
    -- Ensure FAQs policy also explicitly allows public access
    -- The existing policy should work, but let's make it explicit
    DROP POLICY IF EXISTS "Public can view visible FAQs" ON public.faqs;

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
  END IF;
END $$;

