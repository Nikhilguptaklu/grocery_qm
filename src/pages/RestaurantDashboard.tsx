import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import RestaurantsPage from './Admin/RestaurantsPage';
import RestaurantOrdersPage from './Admin/RestaurantOrdersPage';
import type { Restaurant, RestaurantFood, RestaurantOrder } from './Admin/types';

const RestaurantDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [busy, setBusy] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [foods, setFoods] = useState<RestaurantFood[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [deliveryUsers, setDeliveryUsers] = useState<any[]>([]);

  const [view, setView] = useState<'products' | 'orders'>('products');

  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodPrice, setNewFoodPrice] = useState<number | ''>('');

  useEffect(() => { void load(); }, [user, loading]);

  const load = async () => {
    if (loading) return; // wait until auth is resolved on refresh
    if (!user) {
      navigate('/login');
      return;
    }
    setBusy(true);
    try {
      const { data: profile } = await (supabase as any).from('profiles').select('role').eq('id', user.id).maybeSingle();
      const role = (profile as any)?.role || null;
      if (role !== 'admin' && role !== 'restaurant') {
        toast({ title: 'Access denied', description: 'You do not have access to the Restaurant dashboard.', variant: 'destructive' });
        navigate('/');
        return;
      }
  const { data: restaurantsData } = await (supabase as any).from('restaurants').select('*').order('created_at', { ascending: false });
  setRestaurants((restaurantsData as any[]) || []);

  const { data: foodsData } = await (supabase as any).from('restaurant_foods').select('*').order('created_at', { ascending: false });
  setFoods((foodsData as any[]) || []);

  const { data: restaurantOrdersData, error: restaurantOrdersError } = await (supabase as any)
    .from('restaurant_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (restaurantOrdersError) {
    console.error('Restaurant orders fetch error:', restaurantOrdersError);
    setOrders([]);
  } else if (restaurantOrdersData && restaurantOrdersData.length > 0) {
    const restaurantOrderUserIds = [...new Set((restaurantOrdersData as any[]).map((order) => order.user_id))];

    const { data: restaurantOrderProfilesData } = await (supabase as any)
      .from('profiles')
      .select('id, name, email, phone')
      .in('id', restaurantOrderUserIds);

    const orderIds = (restaurantOrdersData as any[]).map((order) => order.id);
    let restaurantOrderItemsData: any[] | null = null;

    if (orderIds.length > 0) {
      const { data: itemsData, error: itemsError } = await (supabase as any)
        .from('restaurant_order_items')
        .select('id, order_id, restaurant_food_id, quantity, price')
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('Restaurant order items fetch error:', itemsError);
      } else {
        restaurantOrderItemsData = itemsData ?? null;
      }
    }

    const foodsMap = new Map((foods as any[]).map((food) => [food.id, food]));

    const ordersWithExtras = (restaurantOrdersData as any[]).map((order) => ({
      ...order,
      profiles: restaurantOrderProfilesData?.find((p) => p.id === order.user_id) || null,
      items:
        restaurantOrderItemsData
          ?.filter((item) => item.order_id === order.id)
          .map((item) => ({
            ...item,
            food: foodsMap.get(item.restaurant_food_id) || null,
          })) || [],
    }));

    setOrders(ordersWithExtras as any[]);
  } else {
    setOrders([]);
  }

  const { data: profilesDataAll } = await (supabase as any).from('profiles').select('*').order('created_at', { ascending: false });
  setDeliveryUsers(((profilesDataAll as any[]) || []).filter((u) => u.role === 'delivery'));
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load restaurant data', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleAddRestaurant = async () => {
    if (!newRestaurantName) return toast({ title: 'Invalid', description: 'Name is required' });
    try {
      const { data, error } = await (supabase as any).from('restaurants').insert([{ name: newRestaurantName, is_active: true, delivery_fee: 0, free_delivery_threshold: 0 }]).select();
      if (error) throw error;
      setRestaurants([...(data as any[] || []), ...restaurants]);
      setNewRestaurantName('');
      toast({ title: 'Created', description: 'Restaurant added' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to add restaurant', variant: 'destructive' });
    }
  };

  const handleAddFood = async () => {
    if (!newFoodName || newFoodPrice === '') return toast({ title: 'Invalid', description: 'Name and price are required' });
    try {
      const { data, error } = await (supabase as any).from('restaurant_foods').insert([{ name: newFoodName, price: Number(newFoodPrice), is_available: true, restaurant_id: restaurants[0]?.id || null }]).select();
      if (error) throw error;
      setFoods([...(data as any[] || []), ...foods]);
      setNewFoodName('');
      setNewFoodPrice('');
      toast({ title: 'Created', description: 'Food added' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to add food', variant: 'destructive' });
    }
  };

  if (busy || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Restaurant Dashboard | HN Mart</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold">Restaurant Dashboard</h1>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                className={`px-4 py-2 rounded-lg ${view === 'products' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}
                onClick={() => setView('products')}
              >
                Products
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${view === 'orders' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}
                onClick={() => setView('orders')}
              >
                Orders
              </button>
            </div>

            <div>
              {view === 'products' ? (
                <RestaurantsPage restaurants={restaurants} foods={foods} onRefresh={load} />
              ) : (
                <RestaurantOrdersPage orders={orders} restaurants={restaurants} deliveryUsers={deliveryUsers} onRefresh={load} />
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
