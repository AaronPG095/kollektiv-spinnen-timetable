-- Add paypal_payment_link column to soli_contribution_settings table
ALTER TABLE public.soli_contribution_settings 
ADD COLUMN IF NOT EXISTS paypal_payment_link TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.soli_contribution_settings.paypal_payment_link IS 'PayPal payment link URL for Soli-Contribution checkout. Must be a valid PayPal domain (paypal.com, paypal.me) and use HTTPS.';
