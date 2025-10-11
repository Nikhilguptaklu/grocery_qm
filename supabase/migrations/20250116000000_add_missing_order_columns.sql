-- Add missing columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,8);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_lon DECIMAL(11,8);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2);

-- Create delivery_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.delivery_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  free_delivery_threshold DECIMAL(10,2) NOT NULL DEFAULT 2000.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on delivery_settings
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for delivery_settings (public read access)
CREATE POLICY "Delivery settings are viewable by everyone" 
ON public.delivery_settings 
FOR SELECT 
USING (true);

-- Insert default delivery settings if none exist
INSERT INTO public.delivery_settings (delivery_fee, free_delivery_threshold, is_active)
SELECT 50.00, 2000.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.delivery_settings WHERE is_active = true);

-- Create trigger for updated_at on delivery_settings
CREATE TRIGGER update_delivery_settings_updated_at
  BEFORE UPDATE ON public.delivery_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
