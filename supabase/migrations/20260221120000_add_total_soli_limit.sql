-- Add total_soli_limit: caps ALL confirmed Soli-Contributions (Early Bird + Fast Bunny + Normal Bird combined)

-- A. Add column to soli_contribution_settings
ALTER TABLE public.soli_contribution_settings
  ADD COLUMN IF NOT EXISTS total_soli_limit INTEGER;

-- B. Create get_total_soli_purchase_count function (counts all confirmed purchases regardless of contribution_type)
CREATE OR REPLACE FUNCTION public.get_total_soli_purchase_count()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(COUNT(*), 0)::INTEGER
  FROM public.soli_contribution_purchases
  WHERE status = 'confirmed';
$$;

-- C. Update validate_universal_limit_on_confirm: check total_soli_limit first, before per-type limits
CREATE OR REPLACE FUNCTION public.validate_universal_limit_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _total_soli_limit INTEGER;
  _total_count INTEGER;
  _early_bird_limit INTEGER;
  _normal_limit INTEGER;
  _fast_bunny_limit INTEGER;
  _effective_fast_bunny_limit INTEGER;
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
      total_soli_limit,
      early_bird_total_limit,
      normal_total_limit,
      fast_bunny_total_limit
    INTO
      _total_soli_limit,
      _early_bird_limit,
      _normal_limit,
      _fast_bunny_limit
    FROM public.soli_contribution_settings
    WHERE id = '00000000-0000-0000-0000-000000000001';

    -- 1. Check total limit first (across all contribution types)
    IF _total_soli_limit IS NOT NULL THEN
      _total_count := public.get_total_soli_purchase_count();
      IF OLD.status = 'confirmed' THEN
        IF _total_count > _total_soli_limit THEN
          RAISE EXCEPTION 'Total Soli-Contribution limit exceeded. Current count: %, Limit: %', _total_count, _total_soli_limit;
        END IF;
      ELSE
        IF _total_count >= _total_soli_limit THEN
          RAISE EXCEPTION 'Total Soli-Contribution limit exceeded. Current count: %, Limit: %. Cannot confirm additional purchase.', _total_count, _total_soli_limit;
        END IF;
      END IF;
    END IF;

    -- 2. Per-type universal limits
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

    IF _is_fast_bunny THEN
      _effective_fast_bunny_limit := COALESCE(_fast_bunny_limit, _early_bird_limit);
      IF _effective_fast_bunny_limit IS NOT NULL THEN
        _early_bird_count := public.get_early_bird_purchase_count();
        _fast_bunny_count := public.get_fast_bunny_purchase_count();
        IF _fast_bunny_limit IS NOT NULL THEN
          IF OLD.status = 'confirmed' THEN
            IF _fast_bunny_count > _fast_bunny_limit THEN
              RAISE EXCEPTION 'Fast Bunny universal limit exceeded. Current count: %, Limit: %', _fast_bunny_count, _fast_bunny_limit;
            END IF;
          ELSE
            IF _fast_bunny_count >= _fast_bunny_limit THEN
              RAISE EXCEPTION 'Fast Bunny universal limit exceeded. Current count: %, Limit: %. Cannot confirm additional purchase.', _fast_bunny_count, _fast_bunny_limit;
            END IF;
          END IF;
        ELSE
          IF OLD.status = 'confirmed' THEN
            IF _early_bird_count + _fast_bunny_count > _early_bird_limit THEN
              RAISE EXCEPTION 'Early-Bird/Fast Bunny shared pool exceeded. Current: % early + % fast bunny, Limit: %', _early_bird_count, _fast_bunny_count, _early_bird_limit;
            END IF;
          ELSE
            IF _early_bird_count + _fast_bunny_count >= _early_bird_limit THEN
              RAISE EXCEPTION 'Early-Bird/Fast Bunny shared pool exceeded. Current: % early + % fast bunny, Limit: %. Cannot confirm additional purchase.', _early_bird_count, _fast_bunny_count, _early_bird_limit;
            END IF;
          END IF;
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
