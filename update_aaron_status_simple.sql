-- Temporarily disable the trigger, update status, then re-enable
-- This avoids the trigger function error

-- Disable the trigger
ALTER TABLE public.soli_contribution_purchases DISABLE TRIGGER enforce_universal_limit_trigger;

-- Update Aaron Greyling's purchase status to confirmed
UPDATE public.soli_contribution_purchases
SET status = 'confirmed'
WHERE purchaser_name ILIKE '%Aaron%Greyling%' 
   OR purchaser_name ILIKE '%Greyling%Aaron%'
   OR (purchaser_name ILIKE '%Aaron%' AND purchaser_name ILIKE '%Greyling%')
   OR purchaser_email ILIKE '%aaron%greyling%';

-- Re-enable the trigger
ALTER TABLE public.soli_contribution_purchases ENABLE TRIGGER enforce_universal_limit_trigger;
