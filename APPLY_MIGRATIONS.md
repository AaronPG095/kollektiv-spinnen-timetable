# How to Apply Supabase Migrations

The `about_page_content` and `about_page_photos` tables are missing from your database. You need to apply the migration to create them.

## Option 1: Using Supabase Dashboard (Easiest)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the SQL below (the complete migration)
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify the tables were created by checking the **Table Editor** section

## Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

## Option 3: Run SQL Directly (Complete Migration)

**Copy this complete SQL and run it in the Supabase SQL Editor:**

```sql
-- Create about_page_content table (single-row configuration)
CREATE TABLE public.about_page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create about_page_photos table
CREATE TABLE public.about_page_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  alignment TEXT NOT NULL DEFAULT 'center' CHECK (alignment IN ('left', 'center', 'right')),
  size TEXT NOT NULL DEFAULT 'medium' CHECK (size IN ('small', 'medium', 'large', 'full')),
  order_index INTEGER NOT NULL DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.about_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_page_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for about_page_content
CREATE POLICY "Public can view about page content" 
ON public.about_page_content 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert about page content" 
ON public.about_page_content 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update about page content" 
ON public.about_page_content 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for about_page_photos
CREATE POLICY "Public can view about page photos" 
ON public.about_page_photos 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert about page photos" 
ON public.about_page_photos 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update about page photos" 
ON public.about_page_photos 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete about page photos" 
ON public.about_page_photos 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_about_page_content_updated_at
BEFORE UPDATE ON public.about_page_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_about_page_photos_updated_at
BEFORE UPDATE ON public.about_page_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content row
INSERT INTO public.about_page_content (id) 
VALUES ('00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;
```

## Verify Tables Were Created

After running the migration:

1. Go to **Table Editor** in Supabase Dashboard
2. You should see:
   - `about_page_content` table
   - `about_page_photos` table

## Check Other Missing Tables

You may also need to check if these tables exist:
- `ticket_settings` (from `20251208113520_create_ticket_settings.sql`)
- `ticket_purchases` (from `20251208140000_create_ticket_purchases.sql`)

If they're missing, apply those migrations as well.

