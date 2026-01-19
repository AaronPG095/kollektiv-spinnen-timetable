-- Remove Tech Helper role from the database
-- This migration removes all references to techHelfer/tech_helper role

-- 1. Drop columns from ticket_settings table
ALTER TABLE public.ticket_settings
  DROP COLUMN IF EXISTS tech_limit,
  DROP COLUMN IF EXISTS tech_price_early,
  DROP COLUMN IF EXISTS tech_price_normal;

-- 2. Update ticket_purchases table to remove 'techHelfer' from role CHECK constraint
-- First, we need to drop the existing constraint and recreate it without techHelfer
ALTER TABLE public.ticket_purchases
  DROP CONSTRAINT IF EXISTS ticket_purchases_role_check;

ALTER TABLE public.ticket_purchases
  ADD CONSTRAINT ticket_purchases_role_check 
  CHECK (role IN (
    'bar', 'kuechenhilfe', 'springerRunner', 'springerToilet',
    'abbau', 'aufbau', 'awareness', 'schichtleitung'
  ));

-- 3. Update the is_role_available function to remove techHelfer case
CREATE OR REPLACE FUNCTION public.is_role_available(_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM public.ticket_settings 
      WHERE id = '00000000-0000-0000-0000-000000000001'
    ) THEN true
    WHEN EXISTS (
      SELECT 1 FROM public.ticket_settings 
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
        ELSE NULL
      END
      FROM public.ticket_settings
      WHERE id = '00000000-0000-0000-0000-000000000001'
    ) > public.get_role_purchase_count(_role)
  END
$$;
