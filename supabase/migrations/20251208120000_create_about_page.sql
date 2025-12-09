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

