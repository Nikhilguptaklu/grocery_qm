export interface ProfileSummary {
  id?: string;
  name: string | null;
  email: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  stock: number;
  image: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  unit?: string | null;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string | null;
  user_id: string;
  admin_notes?: string | null;
  profiles?: ProfileSummary | null;
}

export interface OrderItemProduct {
  id: string;
  name: string;
  image: string | null;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: OrderItemProduct;
}

export interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: string | null;
  user_id: string;
  delivery_person_id: string | null;
  payment_method: string | null;
  delivery_notes?: string | null;
  estimated_delivery?: string | null;
  coupon_code?: string | null;
  discount_amount?: number | null;
  profiles?: ProfileSummary | null;
  order_items?: OrderItem[];
}

export type AppRole = 'admin' | 'customer' | 'delivery' | null;

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  role: AppRole;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string;
  created_at: string;
  updated_at?: string | null;
}

export interface DeliverySettings {
  id: string;
  free_delivery_threshold: number;
  delivery_fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface RestaurantFood {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface RestaurantOrderItem {
  id: string;
  order_id: string;
  restaurant_food_id: string;
  quantity: number;
  price: number;
  food?: RestaurantFood | null;
}

export type RestaurantOrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled';

export interface RestaurantOrder {
  id: string;
  restaurant_id: string;
  user_id: string;
  status: RestaurantOrderStatus;
  total_amount: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string | null;
  delivery_person_id?: string | null;
  estimated_delivery?: string | null;
  delivery_address?: string | null;
  delivery_lat?: number | null;
  delivery_lon?: number | null;
  profiles?: ProfileSummary | null;
  items?: RestaurantOrderItem[];
}
