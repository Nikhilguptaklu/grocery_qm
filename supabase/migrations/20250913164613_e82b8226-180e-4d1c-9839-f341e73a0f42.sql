-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  description TEXT,
  stock INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- RLS Policies for products (public read access)
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for order_items
CREATE POLICY "Users can view order items for their orders" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create order items for their orders" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Create trigger for profiles on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update timestamps
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample products
INSERT INTO public.products (name, price, category, image, description) VALUES
-- Grocery
('Whole Wheat Bread', 3.99, 'grocery', '/placeholder.svg', 'Fresh whole wheat bread'),
('Organic Milk (1L)', 4.49, 'grocery', '/placeholder.svg', 'Fresh organic milk'),
('Brown Rice (2kg)', 8.99, 'grocery', '/placeholder.svg', 'Premium brown rice'),
('Olive Oil (500ml)', 12.99, 'grocery', '/placeholder.svg', 'Extra virgin olive oil'),
('Pasta (500g)', 2.99, 'grocery', '/placeholder.svg', 'Italian pasta'),
('Canned Tomatoes', 1.89, 'grocery', '/placeholder.svg', 'Organic canned tomatoes'),

-- Vegetables
('Fresh Tomatoes (1kg)', 4.99, 'vegetables', '/placeholder.svg', 'Fresh red tomatoes'),
('Organic Carrots (500g)', 3.49, 'vegetables', '/placeholder.svg', 'Organic baby carrots'),
('Fresh Spinach (250g)', 2.99, 'vegetables', '/placeholder.svg', 'Fresh green spinach'),
('Bell Peppers (3pcs)', 5.99, 'vegetables', '/placeholder.svg', 'Mixed bell peppers'),
('Red Onions (1kg)', 2.49, 'vegetables', '/placeholder.svg', 'Fresh red onions'),
('Fresh Broccoli', 3.99, 'vegetables', '/placeholder.svg', 'Fresh green broccoli'),

-- Fruits
('Red Apples (1kg)', 5.99, 'fruits', '/placeholder.svg', 'Fresh red apples'),
('Fresh Bananas (1kg)', 3.49, 'fruits', '/placeholder.svg', 'Ripe yellow bananas'),
('Orange Pack (2kg)', 7.99, 'fruits', '/placeholder.svg', 'Fresh oranges'),
('Fresh Grapes (500g)', 6.99, 'fruits', '/placeholder.svg', 'Sweet grapes'),
('Strawberries (250g)', 4.99, 'fruits', '/placeholder.svg', 'Fresh strawberries'),
('Mango (3pcs)', 8.99, 'fruits', '/placeholder.svg', 'Ripe mangoes'),

-- Cold Drinks
('Coca Cola (2L)', 3.99, 'cold-drinks', '/placeholder.svg', 'Classic Coca Cola'),
('Orange Juice (1L)', 4.99, 'cold-drinks', '/placeholder.svg', 'Fresh orange juice'),
('Sparkling Water (6pack)', 5.49, 'cold-drinks', '/placeholder.svg', 'Sparkling mineral water'),
('Energy Drink (250ml)', 2.99, 'cold-drinks', '/placeholder.svg', 'Energy boost drink'),
('Iced Tea (500ml)', 2.49, 'cold-drinks', '/placeholder.svg', 'Refreshing iced tea'),
('Lemonade (1L)', 3.49, 'cold-drinks', '/placeholder.svg', 'Fresh lemonade');