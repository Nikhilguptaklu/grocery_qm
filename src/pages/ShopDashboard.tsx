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
import ProductsPage from './Admin/ProductsPage';
import OrdersPage from './Admin/OrdersPage';
import type { Product } from './Admin/types';
import type { Order, AdminUser } from './Admin/types';

const ShopDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [busy, setBusy] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryUsers, setDeliveryUsers] = useState<AdminUser[]>([]);

  const [view, setView] = useState<'products' | 'orders'>('products');

  // Minimal form state for adding a product (local-save via Supabase insert)
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>('');

  useEffect(() => {
    void checkAccessAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const checkAccessAndLoad = async () => {
    if (loading) return; // wait until auth is resolved on refresh
    if (!user) {
      navigate('/login');
      return;
    }
  setBusy(true);
    try {
      const { data: profile } = await (supabase as any).from('profiles').select('role').eq('id', user.id).maybeSingle();
      const role = (profile as any)?.role || null;
      if (role !== 'admin' && role !== 'shop') {
        toast({ title: 'Access denied', description: 'You do not have access to the Shop dashboard.', variant: 'destructive' });
        navigate('/');
        return;
      }
  const { data: productsData } = await (supabase as any).from('products').select('*').order('created_at', { ascending: false });
  setProducts((productsData as any[]) || []);

  const { data: ordersData, error: ordersError } = await (supabase as any).from('orders').select(
    `
      id,
      total_amount,
      status,
      created_at,
      delivery_address,
      delivery_person_id,
      user_id,
      payment_method
    `
  ).order('created_at', { ascending: false });

  if (ordersError) {
    console.error('Orders fetch error:', ordersError);
    setOrders([]);
  } else if (ordersData && ordersData.length > 0) {
    const userIds = [...new Set((ordersData as any[]).map((order) => order.user_id))];
    const { data: profilesData } = await (supabase as any).from('profiles').select('id, name, email, phone').in('id', userIds);

    const orderIds = (ordersData as any[]).map((order) => order.id);
    const { data: orderItemsData, error: orderItemsError } = await (supabase as any)
      .from('order_items')
      .select(
        `
          id,
          order_id,
          quantity,
          price,
          products:product_id (
            id,
            name,
            image
          )
        `
      )
      .in('order_id', orderIds);

    if (orderItemsError) {
      console.error('Order items fetch error:', orderItemsError);
    }

    const ordersWithDetails = (ordersData as any[]).map((order) => ({
      ...order,
      profiles: profilesData?.find((p) => p.id === order.user_id) || null,
      order_items:
        orderItemsData
          ?.filter((item) => item.order_id === order.id)
          .map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            product: {
              id: item.products?.id || '',
              name: item.products?.name || 'Unknown Product',
              image: item.products?.image || null,
            },
          })) || [],
    }));

    setOrders(ordersWithDetails as any[]);
  } else {
    setOrders([]);
  }

  const { data: usersData } = await (supabase as any).from('profiles').select('*').order('created_at', { ascending: false });
  // Only delivery users should appear in the assign dropdown
  const deliveries = (usersData as any[] || []).filter((u) => u.role === 'delivery');
  setDeliveryUsers(deliveries);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load shop data', variant: 'destructive' });
    } finally {
  setBusy(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newName || newPrice === '') return toast({ title: 'Invalid', description: 'Name and price are required' });
    try {
  const { data, error } = await (supabase as any).from('products').insert([{ name: newName, price: Number(newPrice), category: 'uncategorized' }]).select();
      if (error) throw error;
      setProducts([...(data as any[] || []), ...products]);
      setNewName('');
      setNewPrice('');
      toast({ title: 'Created', description: 'Product added successfully' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to add product', variant: 'destructive' });
    }
  };

  if (busy || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Shop Dashboard | HN Mart</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold">Shop Dashboard</h1>

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
              <ProductsPage products={products} onRefresh={checkAccessAndLoad} currentUserId={user?.id} />
            ) : (
              <OrdersPage orders={orders} deliveryUsers={deliveryUsers} onRefresh={checkAccessAndLoad} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;
