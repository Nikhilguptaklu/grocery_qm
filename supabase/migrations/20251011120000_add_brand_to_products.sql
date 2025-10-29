-- Add brand column to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS brand TEXT;

-- Update existing rows with empty brand to NULL (no-op but explicit)
UPDATE public.products SET brand = NULL WHERE brand = '';
