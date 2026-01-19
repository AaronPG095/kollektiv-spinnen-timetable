-- Step 1: Fix the trigger function to use contribution_type instead of ticket_type
CREATE OR REPLACE FUNCTION public.validate_universal_limit_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _early_bird_limit INTEGER;
  _normal_limit INTEGER;
  _early_bird_count INTEGER;
  _normal_count INTEGER;
  _is_early_bird BOOLEAN;
  _is_normal BOOLEAN;
BEGIN
  -- Only validate when status is 'confirmed' (for both INSERT and UPDATE)
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Determine ticket type (using contribution_type, not ticket_type)
    _is_early_bird := NEW.contribution_type IN ('earlyBird', 'reducedEarlyBird');
    _is_normal := NEW.contribution_type IN ('normal', 'reducedNormal');
    
    -- Get universal limits from soli_contribution_settings
    SELECT 
      early_bird_total_limit,
      normal_total_limit
    INTO 
      _early_bird_limit,
      _normal_limit
    FROM public.soli_contribution_settings
    WHERE id = '00000000-0000-0000-0000-000000000001';
    
    -- Validate early-bird universal limit
    IF _is_early_bird AND _early_bird_limit IS NOT NULL THEN
      -- Get current count of confirmed early-bird purchases
      _early_bird_count := public.get_early_bird_purchase_count();
      
      -- If this purchase is already confirmed, don't count it twice
      IF OLD.status = 'confirmed' THEN
        -- Purchase was already confirmed, so current_count already includes it
        -- Check if we're still within limit
        IF _early_bird_count > _early_bird_limit THEN
          RAISE EXCEPTION 'Early-Bird universal limit exceeded. Current count: %, Limit: %', _early_bird_count, _early_bird_limit;
        END IF;
      ELSE
        -- Purchase is being confirmed for the first time (INSERT or UPDATE from pending)
        -- Check if confirming it would exceed the limit
        IF _early_bird_count >= _early_bird_limit THEN
          RAISE EXCEPTION 'Early-Bird universal limit exceeded. Current count: %, Limit: %. Cannot confirm additional purchase.', _early_bird_count, _early_bird_limit;
        END IF;
      END IF;
    END IF;
    
    -- Validate normal-bird universal limit
    IF _is_normal AND _normal_limit IS NOT NULL THEN
      -- Get current count of confirmed normal bird purchases
      _normal_count := public.get_normal_purchase_count();
      
      -- If this purchase is already confirmed, don't count it twice
      IF OLD.status = 'confirmed' THEN
        -- Purchase was already confirmed, so current_count already includes it
        -- Check if we're still within limit
        IF _normal_count > _normal_limit THEN
          RAISE EXCEPTION 'Normal Bird universal limit exceeded. Current count: %, Limit: %', _normal_count, _normal_limit;
        END IF;
      ELSE
        -- Purchase is being confirmed for the first time (INSERT or UPDATE from pending)
        -- Check if confirming it would exceed the limit
        IF _normal_count >= _normal_limit THEN
          RAISE EXCEPTION 'Normal Bird universal limit exceeded. Current count: %, Limit: %. Cannot confirm additional purchase.', _normal_count, _normal_limit;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 2: Now update Aaron Greyling's purchase status to confirmed
UPDATE public.soli_contribution_purchases
SET status = 'confirmed'
WHERE purchaser_name ILIKE '%Aaron%Greyling%' 
   OR purchaser_name ILIKE '%Greyling%Aaron%'
   OR (purchaser_name ILIKE '%Aaron%' AND purchaser_name ILIKE '%Greyling%')
   OR purchaser_email ILIKE '%aaron%greyling%';
