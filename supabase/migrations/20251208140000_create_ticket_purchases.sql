-- Create ticket_purchases table to track all ticket sales
CREATE TABLE public.ticket_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('earlyBird', 'normal', 'reducedEarlyBird', 'reducedNormal')),
  role TEXT NOT NULL CHECK (role IN (
    'bar', 'kuechenhilfe', 'springerRunner', 'springerToilet',
    'abbau', 'aufbau', 'awareness', 'schichtleitung', 'techHelfer'
  )),
  price NUMERIC(10, 2) NOT NULL,
  purchaser_name TEXT NOT NULL,
  purchaser_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_ticket_purchases_role ON public.ticket_purchases(role);
CREATE INDEX idx_ticket_purchases_status ON public.ticket_purchases(status);
CREATE INDEX idx_ticket_purchases_user ON public.ticket_purchases(user_id);
CREATE INDEX idx_ticket_purchases_created ON public.ticket_purchases(created_at);

-- Enable Row Level Security
ALTER TABLE public.ticket_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_purchases
-- Public can view confirmed purchases (for availability checks)
CREATE POLICY "Public can view confirmed purchases" 
ON public.ticket_purchases 
FOR SELECT 
USING (status = 'confirmed');

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases" 
ON public.ticket_purchases 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

-- Anyone can insert purchases (for checkout)
CREATE POLICY "Anyone can create purchases" 
ON public.ticket_purchases 
FOR INSERT 
WITH CHECK (true);

-- Only admins can update purchases
CREATE POLICY "Admins can update purchases" 
ON public.ticket_purchases 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete purchases
CREATE POLICY "Admins can delete purchases" 
ON public.ticket_purchases 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ticket_purchases_updated_at
BEFORE UPDATE ON public.ticket_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get purchase count for a role (only confirmed purchases)
-- IMPORTANT: This function counts ALL confirmed purchases for a role regardless of ticket_type.
-- Role limits apply to the TOTAL count of confirmed purchases, combining:
-- - Early Bird tickets (earlyBird)
-- - Normal-Bird tickets (normal)
-- - Reduced Early Bird tickets (reducedEarlyBird)
-- - Reduced Normal-Bird tickets (reducedNormal)
-- For example, if bar_limit is 20, then the total of all confirmed bar tickets
-- (whether Early Bird or Normal) cannot exceed 20.
CREATE OR REPLACE FUNCTION public.get_role_purchase_count(_role TEXT)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(COUNT(*), 0)::INTEGER
  FROM public.ticket_purchases
  WHERE role = _role
    AND status = 'confirmed'
$$;

-- Function to check if a role is available (has remaining tickets)
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
      FROM public.ticket_settings
      WHERE id = '00000000-0000-0000-0000-000000000001'
    ) > public.get_role_purchase_count(_role)
  END
$$;

