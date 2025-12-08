-- Create ticket_settings table (single-row configuration)
CREATE TABLE public.ticket_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  early_bird_enabled BOOLEAN NOT NULL DEFAULT false,
  early_bird_cutoff TIMESTAMP WITH TIME ZONE,
  -- Limits for Standard roles
  bar_limit INTEGER,
  kuechenhilfe_limit INTEGER,
  springer_runner_limit INTEGER,
  springer_toilet_limit INTEGER,
  -- Limits for Reduced roles
  abbau_limit INTEGER,
  aufbau_limit INTEGER,
  awareness_limit INTEGER,
  schichtleitung_limit INTEGER,
  tech_limit INTEGER,
  -- Prices for Standard roles
  bar_price_early NUMERIC(10, 2),
  bar_price_normal NUMERIC(10, 2),
  kuechenhilfe_price_early NUMERIC(10, 2),
  kuechenhilfe_price_normal NUMERIC(10, 2),
  springer_runner_price_early NUMERIC(10, 2),
  springer_runner_price_normal NUMERIC(10, 2),
  springer_toilet_price_early NUMERIC(10, 2),
  springer_toilet_price_normal NUMERIC(10, 2),
  -- Prices for Reduced roles
  abbau_price_early NUMERIC(10, 2),
  abbau_price_normal NUMERIC(10, 2),
  aufbau_price_early NUMERIC(10, 2),
  aufbau_price_normal NUMERIC(10, 2),
  awareness_price_early NUMERIC(10, 2),
  awareness_price_normal NUMERIC(10, 2),
  schichtleitung_price_early NUMERIC(10, 2),
  schichtleitung_price_normal NUMERIC(10, 2),
  tech_price_early NUMERIC(10, 2),
  tech_price_normal NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ticket_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for ticket_settings access
-- Public can view ticket settings (needed for Tickets page)
CREATE POLICY "Public can view ticket settings" 
ON public.ticket_settings 
FOR SELECT 
USING (true);

-- Only admins can insert/update ticket settings
CREATE POLICY "Admins can insert ticket settings" 
ON public.ticket_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ticket settings" 
ON public.ticket_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ticket_settings_updated_at
BEFORE UPDATE ON public.ticket_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default row (will be updated by admin)
-- Using a fixed UUID to ensure only one row exists
INSERT INTO public.ticket_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

