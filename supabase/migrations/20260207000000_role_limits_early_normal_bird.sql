-- Role limits: split into Early Bird and Normal Bird per role
-- 1) Add *_limit_early and *_limit_normal for each role
-- 2) Backfill from existing single limit (half each)
-- 3) Add get_role_early_bird_purchase_count and get_role_normal_bird_purchase_count
-- 4) Replace validate_role_limit_on_confirm to use early/normal limits and contribution_type

-- 1. Add new columns for 8 roles (form roles): bar, kuechenhilfe, springer_runner, springer_toilet, abbau, aufbau, awareness, tech
-- Plus schichtleitung for trigger consistency (DB has schichtleitung_limit)
ALTER TABLE public.soli_contribution_settings
  ADD COLUMN IF NOT EXISTS bar_limit_early INTEGER,
  ADD COLUMN IF NOT EXISTS bar_limit_normal INTEGER,
  ADD COLUMN IF NOT EXISTS kuechenhilfe_limit_early INTEGER,
  ADD COLUMN IF NOT EXISTS kuechenhilfe_limit_normal INTEGER,
  ADD COLUMN IF NOT EXISTS springer_runner_limit_early INTEGER,
  ADD COLUMN IF NOT EXISTS springer_runner_limit_normal INTEGER,
  ADD COLUMN IF NOT EXISTS springer_toilet_limit_early INTEGER,
  ADD COLUMN IF NOT EXISTS springer_toilet_limit_normal INTEGER,
  ADD COLUMN IF NOT EXISTS abbau_limit_early INTEGER,
  ADD COLUMN IF NOT EXISTS abbau_limit_normal INTEGER,
  ADD COLUMN IF NOT EXISTS aufbau_limit_early INTEGER,
  ADD COLUMN IF NOT EXISTS aufbau_limit_normal INTEGER,
  ADD COLUMN IF NOT EXISTS awareness_limit_early INTEGER,
  ADD COLUMN IF NOT EXISTS awareness_limit_normal INTEGER,
  ADD COLUMN IF NOT EXISTS schichtleitung_limit_early INTEGER,
  ADD COLUMN IF NOT EXISTS schichtleitung_limit_normal INTEGER,
  ADD COLUMN IF NOT EXISTS tech_limit_early INTEGER,
  ADD COLUMN IF NOT EXISTS tech_limit_normal INTEGER;

-- 2. Backfill from existing single limits (floor half to early, rest to normal)
UPDATE public.soli_contribution_settings
SET
  bar_limit_early = CASE WHEN bar_limit IS NOT NULL THEN FLOOR(bar_limit / 2.0)::INTEGER ELSE NULL END,
  bar_limit_normal = CASE WHEN bar_limit IS NOT NULL THEN bar_limit - FLOOR(bar_limit / 2.0)::INTEGER ELSE NULL END,
  kuechenhilfe_limit_early = CASE WHEN kuechenhilfe_limit IS NOT NULL THEN FLOOR(kuechenhilfe_limit / 2.0)::INTEGER ELSE NULL END,
  kuechenhilfe_limit_normal = CASE WHEN kuechenhilfe_limit IS NOT NULL THEN kuechenhilfe_limit - FLOOR(kuechenhilfe_limit / 2.0)::INTEGER ELSE NULL END,
  springer_runner_limit_early = CASE WHEN springer_runner_limit IS NOT NULL THEN FLOOR(springer_runner_limit / 2.0)::INTEGER ELSE NULL END,
  springer_runner_limit_normal = CASE WHEN springer_runner_limit IS NOT NULL THEN springer_runner_limit - FLOOR(springer_runner_limit / 2.0)::INTEGER ELSE NULL END,
  springer_toilet_limit_early = CASE WHEN springer_toilet_limit IS NOT NULL THEN FLOOR(springer_toilet_limit / 2.0)::INTEGER ELSE NULL END,
  springer_toilet_limit_normal = CASE WHEN springer_toilet_limit IS NOT NULL THEN springer_toilet_limit - FLOOR(springer_toilet_limit / 2.0)::INTEGER ELSE NULL END,
  abbau_limit_early = CASE WHEN abbau_limit IS NOT NULL THEN FLOOR(abbau_limit / 2.0)::INTEGER ELSE NULL END,
  abbau_limit_normal = CASE WHEN abbau_limit IS NOT NULL THEN abbau_limit - FLOOR(abbau_limit / 2.0)::INTEGER ELSE NULL END,
  aufbau_limit_early = CASE WHEN aufbau_limit IS NOT NULL THEN FLOOR(aufbau_limit / 2.0)::INTEGER ELSE NULL END,
  aufbau_limit_normal = CASE WHEN aufbau_limit IS NOT NULL THEN aufbau_limit - FLOOR(aufbau_limit / 2.0)::INTEGER ELSE NULL END,
  awareness_limit_early = CASE WHEN awareness_limit IS NOT NULL THEN FLOOR(awareness_limit / 2.0)::INTEGER ELSE NULL END,
  awareness_limit_normal = CASE WHEN awareness_limit IS NOT NULL THEN awareness_limit - FLOOR(awareness_limit / 2.0)::INTEGER ELSE NULL END,
  schichtleitung_limit_early = CASE WHEN schichtleitung_limit IS NOT NULL THEN FLOOR(schichtleitung_limit / 2.0)::INTEGER ELSE NULL END,
  schichtleitung_limit_normal = CASE WHEN schichtleitung_limit IS NOT NULL THEN schichtleitung_limit - FLOOR(schichtleitung_limit / 2.0)::INTEGER ELSE NULL END,
  tech_limit_early = CASE WHEN tech_limit IS NOT NULL THEN FLOOR(tech_limit / 2.0)::INTEGER ELSE NULL END,
  tech_limit_normal = CASE WHEN tech_limit IS NOT NULL THEN tech_limit - FLOOR(tech_limit / 2.0)::INTEGER ELSE NULL END
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. Helper: count confirmed early-bird purchases for a role
CREATE OR REPLACE FUNCTION public.get_role_early_bird_purchase_count(_role TEXT)
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
    AND contribution_type IN ('earlyBird', 'reducedEarlyBird');
$$;

-- 4. Helper: count confirmed normal-bird purchases for a role
CREATE OR REPLACE FUNCTION public.get_role_normal_bird_purchase_count(_role TEXT)
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
    AND contribution_type IN ('normal', 'reducedNormal');
$$;

-- 5. Replace trigger to enforce early/normal limits with "remaining early adds to normal"
CREATE OR REPLACE FUNCTION public.validate_role_limit_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _limit_early INTEGER;
  _limit_normal INTEGER;
  _early_count INTEGER;
  _normal_count INTEGER;
  _effective_normal INTEGER;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Resolve early and normal limits for this role
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
      END
    INTO _limit_early, _limit_normal
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
    ELSIF NEW.contribution_type IN ('normal', 'reducedNormal') THEN
      IF _limit_normal IS NULL THEN
        RETURN NEW;
      END IF;
      _early_count := public.get_role_early_bird_purchase_count(NEW.role);
      _effective_normal := _limit_normal + GREATEST(0, COALESCE(_limit_early, 0) - _early_count);
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
