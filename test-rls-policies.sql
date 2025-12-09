-- Test RLS Policies for All Tables
-- Run this in Supabase SQL Editor to check if policies allow anonymous access

-- Check Events Policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY policyname;

-- Check FAQs Policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'faqs'
ORDER BY policyname;

-- Check Ticket Settings Policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'ticket_settings'
ORDER BY policyname;

-- Check Ticket Purchases Policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'ticket_purchases'
ORDER BY policyname;

-- Check About Page Content Policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'about_page_content'
ORDER BY policyname;

-- Check About Page Photos Policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'about_page_photos'
ORDER BY policyname;

-- Test anonymous access (simulate what the client does)
-- This should return data if RLS allows anonymous access
SET ROLE anon;
SELECT COUNT(*) as events_count FROM events;
SELECT COUNT(*) as faqs_count FROM faqs WHERE is_visible = true;
SELECT COUNT(*) as ticket_settings_count FROM ticket_settings;
SELECT COUNT(*) as about_content_count FROM about_page_content;
RESET ROLE;

