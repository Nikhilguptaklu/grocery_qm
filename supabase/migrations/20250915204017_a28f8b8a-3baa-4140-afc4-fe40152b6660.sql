-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'customer', 'delivery');

-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN role app_role DEFAULT 'customer';

-- Add address column to profiles table if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;

-- Create issues table for customer support
CREATE TABLE public.issues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  category text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  admin_notes text
);

-- Enable RLS on issues table
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Create policies for issues table
CREATE POLICY "Users can create their own issues" 
ON public.issues 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own issues" 
ON public.issues 
FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Admins can update all issues" 
ON public.issues 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create trigger for updated_at on issues
CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Update orders table to add more delivery statuses
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_person_id uuid REFERENCES auth.users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery timestamp with time zone;

-- Create admin role check function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = user_id
      AND profiles.role = 'admin'
  )
$$;

-- Create delivery person role check function
CREATE OR REPLACE FUNCTION public.is_delivery_person(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = user_id
      AND profiles.role IN ('admin', 'delivery')
  )
$$;