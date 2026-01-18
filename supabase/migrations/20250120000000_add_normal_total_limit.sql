-- Add normal_total_limit column to ticket_settings table
ALTER TABLE public.ticket_settings 
ADD COLUMN IF NOT EXISTS normal_total_limit INTEGER;

-- Function to get count of confirmed normal purchases (across all roles)
-- Note: This function requires the ticket_purchases table to exist
CREATE OR REPLACE FUNCTION public.get_normal_purchase_count()
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
    WHERE ticket_type IN ('normal', 'reducedNormal')
      AND status = 'confirmed'
  );
END;
$$;

-- Function to get remaining normal-bird tickets
CREATE OR REPLACE FUNCTION public.get_remaining_normal_tickets()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total_limit INTEGER;
BEGIN
  SELECT normal_total_limit INTO total_limit
  FROM public.ticket_settings
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  IF total_limit IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN total_limit - public.get_normal_purchase_count();
END;
$$;
