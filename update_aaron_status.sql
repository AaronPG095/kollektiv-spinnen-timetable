-- Simple SQL to update Aaron Greyling's purchase status to confirmed
-- Run this directly in the Supabase SQL Editor

UPDATE public.soli_contribution_purchases
SET status = 'confirmed'
WHERE purchaser_name ILIKE '%Aaron%Greyling%' 
   OR purchaser_name ILIKE '%Greyling%Aaron%'
   OR (purchaser_name ILIKE '%Aaron%' AND purchaser_name ILIKE '%Greyling%')
   OR purchaser_email ILIKE '%aaron%greyling%';
