-- Enforce role limits when ticket purchases are confirmed
-- This trigger ensures that role limits apply to ALL ticket types (earlyBird, normal, reducedEarlyBird, reducedNormal)
-- Role limits count the total number of confirmed purchases for a role, regardless of ticket type

-- Function to validate role limit before confirming a purchase
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
  -- Only validate when status is being changed to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Get the role limit from ticket_settings
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
    FROM public.ticket_settings
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
      -- Purchase is being confirmed for the first time
      -- Check if confirming it would exceed the limit
      IF _current_count >= _role_limit THEN
        RAISE EXCEPTION 'Role % limit exceeded. Current count: %, Limit: %. Cannot confirm additional purchase.', NEW.role, _current_count, _role_limit;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to enforce role limits
DROP TRIGGER IF EXISTS enforce_role_limit_trigger ON public.ticket_purchases;

CREATE TRIGGER enforce_role_limit_trigger
  BEFORE UPDATE ON public.ticket_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_limit_on_confirm();

-- Add comment explaining the trigger
COMMENT ON FUNCTION public.validate_role_limit_on_confirm() IS 
'Validates that role limits are not exceeded when a ticket purchase is confirmed. 
Role limits apply to ALL ticket types (earlyBird, normal, reducedEarlyBird, reducedNormal) combined. 
For example, if bar_limit is 20, then the total of confirmed bar tickets (whether Early Bird or Normal) cannot exceed 20.';
