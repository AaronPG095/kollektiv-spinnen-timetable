-- Add indexes for FAQ table to improve query performance

-- Index for order_index sorting
CREATE INDEX IF NOT EXISTS idx_faqs_order_index ON public.faqs(order_index);

-- Composite index for efficient category/subcategory/order queries
CREATE INDEX IF NOT EXISTS idx_faqs_category_subcategory_order ON public.faqs(category, subcategory, order_index);

-- Composite index for language filtering with visibility
CREATE INDEX IF NOT EXISTS idx_faqs_language_visible ON public.faqs(language, is_visible) WHERE is_visible = true;
