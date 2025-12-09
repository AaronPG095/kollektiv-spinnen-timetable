-- Add email-based admin support
-- This migration adds a table to store admin emails instead of relying on user_roles

-- Create admin_emails table for email-based admin access
CREATE TABLE IF NOT EXISTS public.admin_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Public can view admin emails (needed for checking admin status)
CREATE POLICY "Public can view admin emails" 
ON public.admin_emails 
FOR SELECT 
TO public
USING (true);

-- Only admins can insert admin emails (use user_roles to avoid recursion)
CREATE POLICY "Admins can insert admin emails" 
ON public.admin_emails 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can update admin emails (use user_roles to avoid recursion)
CREATE POLICY "Admins can update admin emails" 
ON public.admin_emails 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can delete admin emails (use user_roles to avoid recursion)
CREATE POLICY "Admins can delete admin emails" 
ON public.admin_emails 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_emails_updated_at
BEFORE UPDATE ON public.admin_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if email is admin
CREATE OR REPLACE FUNCTION public.is_admin_email(_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_emails
    WHERE email = LOWER(TRIM(_email))
  )
$$;

