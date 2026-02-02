-- Fix Tech Role Constraint and Trigger
-- This migration:
-- 1) Drops the old constraint that has 'techHelfer' and creates a new one with 'tech'
-- 2) Updates the validate_role_limit_on_confirm() trigger function to handle 'tech' role

-- 1. Drop the existing constraint (which has 'techHelfer' instead of 'tech')
ALTER TABLE public.soli_contribution_purchases
  DROP CONSTRAINT IF EXISTS ticket_purchases_role_check;

-- Also drop the new constraint name in case it exists but wasn't applied properly
ALTER TABLE public.soli_contribution_purchases
  DROP CONSTRAINT IF EXISTS soli_contribution_purchases_role_check;

-- 2. Add the correct constraint with 'tech' (replacing 'techHelfer')
ALTER TABLE public.soli_contribution_purchases
  ADD CONSTRAINT soli_contribution_purchases_role_check 
  CHECK (role IN (
    'bar', 'kuechenhilfe', 'springerRunner', 'springerToilet',
    'abbau', 'aufbau', 'awareness', 'schichtleitung', 'tech'
  ));

-- 3. Update the trigger function to include 'tech' role in the CASE statement
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
      WHEN 'tech' THEN tech_limit
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
