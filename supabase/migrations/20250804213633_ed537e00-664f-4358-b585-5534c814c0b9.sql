-- Add category and subcategory support to FAQs table
ALTER TABLE public.faqs 
ADD COLUMN category TEXT,
ADD COLUMN subcategory TEXT,
ADD COLUMN language TEXT DEFAULT 'de';

-- Create index for better performance on category/language queries
CREATE INDEX idx_faqs_category_language ON public.faqs(category, language);
CREATE INDEX idx_faqs_subcategory_language ON public.faqs(subcategory, language);