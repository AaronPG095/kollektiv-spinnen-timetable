-- Add early_bird_total_limit column to ticket_settings table
ALTER TABLE public.ticket_settings 
ADD COLUMN IF NOT EXISTS early_bird_total_limit INTEGER;

-- Function to get count of confirmed early-bird purchases
-- Note: This function requires the ticket_purchases table to exist
-- Make sure to apply migration 20251208140000_create_ticket_purchases.sql first
CREATE OR REPLACE FUNCTION public.get_early_bird_purchase_count()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if ticket_purchases table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ticket_purchases'
  ) THEN
    RETURN 0;
  END IF;
  
  RETURN (
    SELECT COALESCE(COUNT(*), 0)::INTEGER
    FROM public.ticket_purchases
    WHERE ticket_type IN ('earlyBird', 'reducedEarlyBird')
      AND status = 'confirmed'
  );
END;
$$;

-- Function to get remaining early-bird tickets
CREATE OR REPLACE FUNCTION public.get_remaining_early_bird_tickets()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total_limit INTEGER;
BEGIN
  SELECT early_bird_total_limit INTO total_limit
  FROM public.ticket_settings
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  IF total_limit IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN total_limit - public.get_early_bird_purchase_count();
END;
$$;

