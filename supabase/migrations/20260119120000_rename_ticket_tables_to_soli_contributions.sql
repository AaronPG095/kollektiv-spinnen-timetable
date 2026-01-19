-- Rename ticket-related tables and columns to Soli-Contribution terminology

-- 1. Rename configuration and purchases tables
ALTER TABLE public.ticket_settings
RENAME TO soli_contribution_settings;

ALTER TABLE public.ticket_purchases
RENAME TO soli_contribution_purchases;

-- 2. Rename ticket_type column to contribution_type
ALTER TABLE public.soli_contribution_purchases
RENAME COLUMN ticket_type TO contribution_type;

-- 3. Rename trigger on purchases table to match new name
ALTER TRIGGER update_ticket_purchases_updated_at
ON public.soli_contribution_purchases
RENAME TO update_soli_contribution_purchases_updated_at;

-- 4. Rename RLS policies on soli_contribution_settings
ALTER POLICY "Public can view ticket settings"
ON public.soli_contribution_settings
RENAME TO "Public can view soli contribution settings";

ALTER POLICY "Admins can insert ticket settings"
ON public.soli_contribution_settings
RENAME TO "Admins can insert soli contribution settings";

ALTER POLICY "Admins can update ticket settings"
ON public.soli_contribution_settings
RENAME TO "Admins can update soli contribution settings";

-- 5. Rename RLS policies on soli_contribution_purchases
ALTER POLICY "Public can view confirmed purchases"
ON public.soli_contribution_purchases
RENAME TO "Public can view confirmed soli contribution purchases";

ALTER POLICY "Users can view own purchases"
ON public.soli_contribution_purchases
RENAME TO "Users can view own soli contribution purchases";

ALTER POLICY "Admins can update purchases"
ON public.soli_contribution_purchases
RENAME TO "Admins can update soli contribution purchases";

ALTER POLICY "Admins can delete purchases"
ON public.soli_contribution_purchases
RENAME TO "Admins can delete soli contribution purchases";

-- 6. Update helper functions to reference new table names explicitly

-- Function to get purchase count for a role (only confirmed purchases)
CREATE OR REPLACE FUNCTION public.get_role_purchase_count(_role TEXT)
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
$$;

-- Function to check if a role is available (has remaining contributions)
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
            WHEN 'techHelfer' THEN tech_limit IS NULL
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
        WHEN 'techHelfer' THEN tech_limit
        ELSE NULL
      END
      FROM public.soli_contribution_settings
      WHERE id = '00000000-0000-0000-0000-000000000001'
    ) > public.get_role_purchase_count(_role)
  END
$$;

