-- Add Tech-Support role to Soli-Contribution system
-- This migration:
-- 1) Extends the role CHECK constraint to allow the new "tech" role
-- 2) Updates the is_role_available helper to apply tech_limit for the new role

-- 1. Update role CHECK constraint on soli_contribution_purchases
ALTER TABLE public.soli_contribution_purchases
  DROP CONSTRAINT IF EXISTS ticket_purchases_role_check;

ALTER TABLE public.soli_contribution_purchases
  ADD CONSTRAINT soli_contribution_purchases_role_check 
  CHECK (role IN (
    'bar', 'kuechenhilfe', 'springerRunner', 'springerToilet',
    'abbau', 'aufbau', 'awareness', 'schichtleitung', 'tech'
  ));

-- 2. Update is_role_available to include tech role / tech_limit
CREATE OR REPLACE FUNCTION public.is_role_available(_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM public.soli_contribution_settings 
      WHERE id = '00000000-0000-0000-0000-000000000001'
    ) THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.soli_contribution_settings 
      WHERE id = '00000000-0000-0000-0000-000000000001'
        AND (
          CASE _role
            WHEN 'bar' THEN bar_limit IS NULL
            WHEN 'kuechenhilfe' THEN kuechenhilfe_limit IS NULL
            WHEN 'springerRunner' THEN springer_runner_limit IS NULL
            WHEN 'springerToilet' THEN springer_toilet_limit IS NULL
            WHEN 'abbau' THEN abbau_limit IS NULL
            WHEN 'aufbau' THEN aufbau_limit IS NULL
            WHEN 'awareness' THEN awareness_limit IS NULL
            WHEN 'schichtleitung' THEN schichtleitung_limit IS NULL
            WHEN 'tech' THEN tech_limit IS NULL
            ELSE true
          END
        )
    ) THEN true
    ELSE (
      SELECT CASE _role
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
      END
      FROM public.soli_contribution_settings
      WHERE id = '00000000-0000-0000-0000-000000000001'
    ) > public.get_role_purchase_count(_role)
  END
$$;

