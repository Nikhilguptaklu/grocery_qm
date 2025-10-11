-- Add delivery-related columns to restaurant_orders table
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS delivery_person_id UUID REFERENCES auth.users(id);
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,8);
ALTER TABLE public.restaurant_orders ADD COLUMN IF NOT EXISTS delivery_lon DECIMAL(11,8);

-- Update the types to include the new columns
-- Note: The TypeScript types will need to be regenerated after this migration
