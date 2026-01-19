-- Update triggers to also fire on INSERT since purchases are now created directly with 'confirmed' status
-- This ensures limits are validated when creating new purchases, not just when updating them

-- Update role limit trigger to also fire on INSERT
-- Also update the function to use soli_contribution_settings instead of ticket_settings
DROP TRIGGER IF EXISTS enforce_role_limit_trigger ON public.soli_contribution_purchases;

-- Update the function to use soli_contribution_settings
CREATE OR REPLACE FUNCTION public.validate_role_limit_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _role_limit INTEGER;
  _current_count INTEGER;
BEGIN
  -- Only validate when status is 'confirmed' (for both INSERT and UPDATE)
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Get the role limit from soli_contribution_settings
    SELECT CASE NEW.role
      WHEN 'bar' THEN bar_limit
      WHEN 'kuechenhilfe' THEN kuechenhilfe_limit
      WHEN 'springerRunner' THEN springer_runner_limit
      WHEN 'springerToilet' THEN springer_toilet_limit
      WHEN 'abbau' THEN abbau_limit
      WHEN 'aufbau' THEN aufbau_limit
      WHEN 'awareness' THEN awareness_limit
      WHEN 'schichtleitung' THEN schichtleitung_limit
      ELSE NULL
    END INTO _role_limit
    FROM public.soli_contribution_settings
    WHERE id = '00000000-0000-0000-0000-000000000001';

    -- If no limit is set (NULL), allow the purchase
    IF _role_limit IS NULL THEN
      RETURN NEW;
    END IF;

    -- If limit is 0, role is sold out
    IF _role_limit = 0 THEN
      RAISE EXCEPTION 'Role % is sold out (limit is 0)', NEW.role;
    END IF;

    -- Get current count of confirmed purchases for this role
    -- This counts ALL ticket types (earlyBird, normal, reducedEarlyBird, reducedNormal)
    _current_count := public.get_role_purchase_count(NEW.role);

    -- If this purchase is already confirmed, don't count it twice
    -- (it might be getting updated for another reason)
    IF OLD.status = 'confirmed' THEN
      -- Purchase was already confirmed, so current_count already includes it
      -- Check if we're still within limit
      IF _current_count > _role_limit THEN
        RAISE EXCEPTION 'Role % limit exceeded. Current count: %, Limit: %', NEW.role, _current_count, _role_limit;
      END IF;
    ELSE
      -- Purchase is being confirmed for the first time (INSERT or UPDATE from pending)
      -- Check if confirming it would exceed the limit
      IF _current_count >= _role_limit THEN
        RAISE EXCEPTION 'Role % limit exceeded. Current count: %, Limit: %. Cannot confirm additional purchase.', NEW.role, _current_count, _role_limit;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_role_limit_trigger
  BEFORE INSERT OR UPDATE ON public.soli_contribution_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_limit_on_confirm();

-- Update universal limit trigger to also fire on INSERT
-- Also fix the column name from ticket_type to contribution_type
DROP TRIGGER IF EXISTS enforce_universal_limit_trigger ON public.soli_contribution_purchases;

-- Update the function to use contribution_type instead of ticket_type
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

CREATE TRIGGER enforce_universal_limit_trigger
  BEFORE INSERT OR UPDATE ON public.soli_contribution_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_universal_limit_on_confirm();
