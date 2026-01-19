-- Remove pending status from soli_contribution_purchases
-- All purchases will now be created with 'confirmed' status

-- First, update any existing pending purchases to confirmed
UPDATE public.soli_contribution_purchases
SET status = 'confirmed'
WHERE status = 'pending';

-- Remove pending from the CHECK constraint
ALTER TABLE public.soli_contribution_purchases
DROP CONSTRAINT IF EXISTS soli_contribution_purchases_status_check;

ALTER TABLE public.soli_contribution_purchases
ADD CONSTRAINT soli_contribution_purchases_status_check 
CHECK (status IN ('confirmed', 'cancelled'));

-- Change default value from 'pending' to 'confirmed'
ALTER TABLE public.soli_contribution_purchases
ALTER COLUMN status SET DEFAULT 'confirmed';
