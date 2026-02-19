-- Add Fast Bunny (Schneller Hase) as a third Soli-Contribution tier
-- Mirrors Early Bird: toggle, cutoff, universal limit, per-role limits and prices
-- Unused Fast Bunny capacity rolls over to Normal Bird

-- A. Extend contribution_type CHECK constraint to include fastBunny and reducedFastBunny
-- Drop existing check constraint (name may vary: ticket_purchases_ticket_type_check or soli_contribution_purchases_contribution_type_check)
DO $$
DECLARE
  _constraint_name TEXT;
BEGIN
  SELECT c.conname INTO _constraint_name
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'public.soli_contribution_purchases'::regclass
    AND c.contype = 'c'
    AND a.attname = 'contribution_type'
  LIMIT 1;
  IF _constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.soli_contribution_purchases DROP CONSTRAINT %I', _constraint_name);
  END IF;
END $$;

ALTER TABLE public.soli_contribution_purchases
  ADD CONSTRAINT soli_contribution_purchases_contribution_type_check
  CHECK (contribution_type IN (
    'earlyBird', 'normal', 'reducedEarlyBird', 'reducedNormal',
    'fastBunny', 'reducedFastBunny'
  ));

-- B. Add Fast Bunny columns to soli_contribution_settings
ALTER TABLE public.soli_contribution_settings
  ADD COLUMN IF NOT EXISTS fast_bunny_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fast_bunny_cutoff TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS fast_bunny_total_limit INTEGER,
  ADD COLUMN IF NOT EXISTS bar_limit_fast_bunny INTEGER,
  ADD COLUMN IF NOT EXISTS bar_price_fast_bunny NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS kuechenhilfe_limit_fast_bunny INTEGER,
  ADD COLUMN IF NOT EXISTS kuechenhilfe_price_fast_bunny NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS springer_runner_limit_fast_bunny INTEGER,
  ADD COLUMN IF NOT EXISTS springer_runner_price_fast_bunny NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS springer_toilet_limit_fast_bunny INTEGER,
  ADD COLUMN IF NOT EXISTS springer_toilet_price_fast_bunny NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS abbau_limit_fast_bunny INTEGER,
  ADD COLUMN IF NOT EXISTS abbau_price_fast_bunny NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS aufbau_limit_fast_bunny INTEGER,
  ADD COLUMN IF NOT EXISTS aufbau_price_fast_bunny NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS awareness_limit_fast_bunny INTEGER,
  ADD COLUMN IF NOT EXISTS awareness_price_fast_bunny NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS schichtleitung_limit_fast_bunny INTEGER,
  ADD COLUMN IF NOT EXISTS schichtleitung_price_fast_bunny NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS tech_limit_fast_bunny INTEGER,
  ADD COLUMN IF NOT EXISTS tech_price_fast_bunny NUMERIC(10, 2);

-- C. Create get_role_fast_bunny_purchase_count function
CREATE OR REPLACE FUNCTION public.get_role_fast_bunny_purchase_count(_role TEXT)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(COUNT(*), 0)::INTEGER
  FROM public.soli_contribution_purchases
  WHERE role = _role
    AND status = 'confirmed'
    AND contribution_type IN ('fastBunny', 'reducedFastBunny');
$$;

-- D. Create get_fast_bunny_purchase_count function (global)
CREATE OR REPLACE FUNCTION public.get_fast_bunny_purchase_count()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(COUNT(*), 0)::INTEGER
  FROM public.soli_contribution_purchases
  WHERE contribution_type IN ('fastBunny', 'reducedFastBunny')
    AND status = 'confirmed';
$$;

-- E. Update validate_role_limit_on_confirm: add Fast Bunny branch, extend effective_normal
CREATE OR REPLACE FUNCTION public.validate_role_limit_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _limit_early INTEGER;
  _limit_normal INTEGER;
  _limit_fast_bunny INTEGER;
  _early_count INTEGER;
  _normal_count INTEGER;
  _fast_bunny_count INTEGER;
  _effective_normal INTEGER;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Resolve early, fast bunny and normal limits for this role
    SELECT
      CASE NEW.role
        WHEN 'bar' THEN bar_limit_early
        WHEN 'kuechenhilfe' THEN kuechenhilfe_limit_early
        WHEN 'springerRunner' THEN springer_runner_limit_early
        WHEN 'springerToilet' THEN springer_toilet_limit_early
        WHEN 'abbau' THEN abbau_limit_early
        WHEN 'aufbau' THEN aufbau_limit_early
        WHEN 'awareness' THEN awareness_limit_early
        WHEN 'schichtleitung' THEN schichtleitung_limit_early
        WHEN 'tech' THEN tech_limit_early
        ELSE NULL
      END,
      CASE NEW.role
        WHEN 'bar' THEN bar_limit_normal
        WHEN 'kuechenhilfe' THEN kuechenhilfe_limit_normal
        WHEN 'springerRunner' THEN springer_runner_limit_normal
        WHEN 'springerToilet' THEN springer_toilet_limit_normal
        WHEN 'abbau' THEN abbau_limit_normal
        WHEN 'aufbau' THEN aufbau_limit_normal
        WHEN 'awareness' THEN awareness_limit_normal
        WHEN 'schichtleitung' THEN schichtleitung_limit_normal
        WHEN 'tech' THEN tech_limit_normal
        ELSE NULL
      END,
      CASE NEW.role
        WHEN 'bar' THEN bar_limit_fast_bunny
        WHEN 'kuechenhilfe' THEN kuechenhilfe_limit_fast_bunny
        WHEN 'springerRunner' THEN springer_runner_limit_fast_bunny
        WHEN 'springerToilet' THEN springer_toilet_limit_fast_bunny
        WHEN 'abbau' THEN abbau_limit_fast_bunny
        WHEN 'aufbau' THEN aufbau_limit_fast_bunny
        WHEN 'awareness' THEN awareness_limit_fast_bunny
        WHEN 'schichtleitung' THEN schichtleitung_limit_fast_bunny
        WHEN 'tech' THEN tech_limit_fast_bunny
        ELSE NULL
      END
    INTO _limit_early, _limit_normal, _limit_fast_bunny
    FROM public.soli_contribution_settings
    WHERE id = '00000000-0000-0000-0000-000000000001';

    IF NEW.contribution_type IN ('earlyBird', 'reducedEarlyBird') THEN
      IF _limit_early IS NULL THEN
        RETURN NEW;
      END IF;
      IF _limit_early = 0 THEN
        RAISE EXCEPTION 'Role % early bird is sold out (limit is 0)', NEW.role;
      END IF;
      _early_count := public.get_role_early_bird_purchase_count(NEW.role);
      IF OLD.status = 'confirmed' THEN
        IF _early_count > _limit_early THEN
          RAISE EXCEPTION 'Role % early bird limit exceeded. Current: %, Limit: %', NEW.role, _early_count, _limit_early;
        END IF;
      ELSE
        IF _early_count >= _limit_early THEN
          RAISE EXCEPTION 'Role % early bird limit exceeded. Current: %, Limit: %. Cannot confirm.', NEW.role, _early_count, _limit_early;
        END IF;
      END IF;
    ELSIF NEW.contribution_type IN ('fastBunny', 'reducedFastBunny') THEN
      IF _limit_fast_bunny IS NULL THEN
        RETURN NEW;
      END IF;
      IF _limit_fast_bunny = 0 THEN
        RAISE EXCEPTION 'Role % fast bunny is sold out (limit is 0)', NEW.role;
      END IF;
      _fast_bunny_count := public.get_role_fast_bunny_purchase_count(NEW.role);
      IF OLD.status = 'confirmed' THEN
        IF _fast_bunny_count > _limit_fast_bunny THEN
          RAISE EXCEPTION 'Role % fast bunny limit exceeded. Current: %, Limit: %', NEW.role, _fast_bunny_count, _limit_fast_bunny;
        END IF;
      ELSE
        IF _fast_bunny_count >= _limit_fast_bunny THEN
          RAISE EXCEPTION 'Role % fast bunny limit exceeded. Current: %, Limit: %. Cannot confirm.', NEW.role, _fast_bunny_count, _limit_fast_bunny;
        END IF;
      END IF;
    ELSIF NEW.contribution_type IN ('normal', 'reducedNormal') THEN
      IF _limit_normal IS NULL THEN
        RETURN NEW;
      END IF;
      _early_count := public.get_role_early_bird_purchase_count(NEW.role);
      _fast_bunny_count := public.get_role_fast_bunny_purchase_count(NEW.role);
      -- Unused early + unused fast bunny roll over to normal
      _effective_normal := _limit_normal
        + GREATEST(0, COALESCE(_limit_early, 0) - _early_count)
        + GREATEST(0, COALESCE(_limit_fast_bunny, 0) - _fast_bunny_count);
      IF _effective_normal = 0 THEN
        RAISE EXCEPTION 'Role % normal bird is sold out', NEW.role;
      END IF;
      _normal_count := public.get_role_normal_bird_purchase_count(NEW.role);
      IF OLD.status = 'confirmed' THEN
        IF _normal_count > _effective_normal THEN
          RAISE EXCEPTION 'Role % normal bird limit exceeded. Current: %, Effective limit: %', NEW.role, _normal_count, _effective_normal;
        END IF;
      ELSE
        IF _normal_count >= _effective_normal THEN
          RAISE EXCEPTION 'Role % normal bird limit exceeded. Current: %, Effective limit: %. Cannot confirm.', NEW.role, _normal_count, _effective_normal;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- F. Update validate_universal_limit_on_confirm: add Fast Bunny branch
CREATE OR REPLACE FUNCTION public.validate_universal_limit_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _early_bird_limit INTEGER;
  _normal_limit INTEGER;
  _fast_bunny_limit INTEGER;
  _early_bird_count INTEGER;
  _normal_count INTEGER;
  _fast_bunny_count INTEGER;
  _is_early_bird BOOLEAN;
  _is_normal BOOLEAN;
  _is_fast_bunny BOOLEAN;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    _is_early_bird := NEW.contribution_type IN ('earlyBird', 'reducedEarlyBird');
    _is_normal := NEW.contribution_type IN ('normal', 'reducedNormal');
    _is_fast_bunny := NEW.contribution_type IN ('fastBunny', 'reducedFastBunny');

    SELECT
      early_bird_total_limit,
      normal_total_limit,
      fast_bunny_total_limit
    INTO
      _early_bird_limit,
      _normal_limit,
      _fast_bunny_limit
    FROM public.soli_contribution_settings
    WHERE id = '00000000-0000-0000-0000-000000000001';

    IF _is_early_bird AND _early_bird_limit IS NOT NULL THEN
      _early_bird_count := public.get_early_bird_purchase_count();
      IF OLD.status = 'confirmed' THEN
        IF _early_bird_count > _early_bird_limit THEN
          RAISE EXCEPTION 'Early-Bird universal limit exceeded. Current count: %, Limit: %', _early_bird_count, _early_bird_limit;
        END IF;
      ELSE
        IF _early_bird_count >= _early_bird_limit THEN
          RAISE EXCEPTION 'Early-Bird universal limit exceeded. Current count: %, Limit: %. Cannot confirm additional purchase.', _early_bird_count, _early_bird_limit;
        END IF;
      END IF;
    END IF;

    IF _is_fast_bunny AND _fast_bunny_limit IS NOT NULL THEN
      _fast_bunny_count := public.get_fast_bunny_purchase_count();
      IF OLD.status = 'confirmed' THEN
        IF _fast_bunny_count > _fast_bunny_limit THEN
          RAISE EXCEPTION 'Fast Bunny universal limit exceeded. Current count: %, Limit: %', _fast_bunny_count, _fast_bunny_limit;
        END IF;
      ELSE
        IF _fast_bunny_count >= _fast_bunny_limit THEN
          RAISE EXCEPTION 'Fast Bunny universal limit exceeded. Current count: %, Limit: %. Cannot confirm additional purchase.', _fast_bunny_count, _fast_bunny_limit;
        END IF;
      END IF;
    END IF;

    IF _is_normal AND _normal_limit IS NOT NULL THEN
      _normal_count := public.get_normal_purchase_count();
      IF OLD.status = 'confirmed' THEN
        IF _normal_count > _normal_limit THEN
          RAISE EXCEPTION 'Normal Bird universal limit exceeded. Current count: %, Limit: %', _normal_count, _normal_limit;
        END IF;
      ELSE
        IF _normal_count >= _normal_limit THEN
          RAISE EXCEPTION 'Normal Bird universal limit exceeded. Current count: %, Limit: %. Cannot confirm additional purchase.', _normal_count, _normal_limit;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
