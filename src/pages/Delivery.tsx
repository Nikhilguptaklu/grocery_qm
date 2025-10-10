import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, MapPin, Clock, CheckCircle, CreditCard } from 'lucide-react';

interface DeliveryOrder {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: string;
  delivery_lat?: number | null;
  delivery_lon?: number | null;
  delivery_notes?: string;
  estimated_delivery?: string;
  payment_method?: string;
  profiles?: { name: string; email: string; phone: string } | null;
  order_items?: {
    quantity: number;
    price: number;
    products: { name: string };
  }[];
}

const Delivery = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const [subscription, setSubscription] = useState<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    checkDeliveryAccess();
  }, [user, authLoading]);

  useEffect(() => {
    if (!realtimeEnabled) return;
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        toast({ title: 'New Order', description: 'A new order was placed.' });
        fetchOrders();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
    setSubscription(channel);
    return () => { channel.unsubscribe(); };
  }, [realtimeEnabled]);

  const checkDeliveryAccess = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'delivery'].includes(profile.role)) {
        toast({
          title: "Access denied",
          description: "You don't have delivery privileges.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      fetchOrders();
      setRealtimeEnabled(true);
    } catch (error) {
      console.error('Error checking delivery access:', error);
      navigate('/');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          delivery_address,
          delivery_lat,
          delivery_lon,
          delivery_notes,
          estimated_delivery,
          delivery_person_id,
          user_id,
          payment_method,
          order_items (
            quantity,
            price,
            products (name)
          )
        `)
        .order('created_at', { ascending: false });

      // Filter orders based on delivery status
      if (filter === 'out-for-delivery') {
        query = query.eq('status', 'out-for-delivery');
      } else if (filter === 'delivered') {
        query = query.eq('status', 'delivered');
      } else if (filter === 'pending') {
        query = query.in('status', ['confirmed', 'preparing']);
      }

      // If user is delivery role (not admin), show only assigned orders
      const { data: roleRow } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id || '')
        .maybeSingle();
      if (roleRow && roleRow.role === 'delivery') {
        query = query.eq('delivery_person_id', user?.id || '');
      }

      const { data: ordersData, error } = await query;

      if (error) throw error;

      const baseOrders = (ordersData || []) as any[];

      // Fetch profiles separately since there is no FK for implicit join
      let profilesById: Record<string, { name: string; email: string; phone: string | null }> = {};
      if (baseOrders.length > 0) {
        const userIds = [...new Set(baseOrders.map(o => o.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email, phone')
          .in('id', userIds);
        if (!profilesError && profilesData) {
          profilesById = Object.fromEntries(profilesData.map((p: any) => [p.id, { name: p.name, email: p.email, phone: p.phone }]));
        }
      }

      const enriched = baseOrders.map(o => ({
        ...o,
        profiles: profilesById[o.user_id] ? {
          name: profilesById[o.user_id].name,
          email: profilesById[o.user_id].email,
          phone: profilesById[o.user_id].phone || ''
        } : null
      }));

      setOrders(enriched as unknown as DeliveryOrder[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const updateData: any = { status };
      
      if (status === 'out-for-delivery') {
        updateData.delivery_person_id = user?.id;
        updateData.estimated_delivery = new Date(Date.now() + 45 * 60 * 1000).toISOString(); // 45 minutes from now
      }

      await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
      
      toast({
        title: "Success",
        description: `Order status updated to ${status}.`,
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'out-for-delivery':
        return 'secondary';
      case 'confirmed':
      case 'preparing':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'out-for-delivery':
        return <Truck className="w-4 h-4" />;
      case 'confirmed':
      case 'preparing':
        return <Clock className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Delivery Dashboard - HN Mart</title>
        <meta name="description" content="Delivery dashboard to manage and track orders for HN Mart. Accept and update delivery statuses in real-time." />
        <meta name="keywords" content="HN Mart, delivery dashboard, grocery delivery, order tracking" />
        <meta property="og:title" content="Delivery Dashboard - HN Mart" />
        <meta property="og:description" content="Delivery dashboard to manage and track orders for HN Mart. Accept and update delivery statuses in real-time." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hnmart.com/delivery" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Delivery Dashboard - HN Mart" />
        <meta name="twitter:description" content="Delivery dashboard to manage and track orders for HN Mart." />
        <script type="application/ld+json">
          {`{
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Delivery Dashboard - HN Mart",
            "description": "Manage and track delivery orders for HN Mart.",
            "url": "https://hnmart.com/delivery"
          }`}
        </script>
      </Helmet>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
            <Truck className="w-8 h-8" />
            <span>Delivery Dashboard</span>
          </h1>
          <p className="text-muted-foreground">Manage delivery orders and track progress</p>
        </div>

        <div className="mb-6">
          <Select value={filter} onValueChange={(value) => {
            setFilter(value);
            setTimeout(fetchOrders, 100);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Ready for Delivery</SelectItem>
              <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-semibold">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(order.status)} className="flex items-center space-x-1">
                    {getStatusIcon(order.status)}
                    <span>{order.status}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Information */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-2">Customer Details</h4>
                  <p className="text-sm"><strong>Name:</strong> {order.profiles?.name}</p>
                  <p className="text-sm"><strong>Email:</strong> {order.profiles?.email}</p>
                  {order.profiles?.phone && (
                    <p className="text-sm"><strong>Phone:</strong> {order.profiles.phone}</p>
                  )}
                  {order.payment_method && (
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      <p className="text-sm"><strong>Payment:</strong> {order.payment_method === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}</p>
                    </div>
                  )}
                </div>

                {/* Delivery Address */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-2 flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>Delivery Address</span>
                  </h4>
                  <p className="text-sm">{order.delivery_address}</p>
                  {order.delivery_lat && order.delivery_lon && (
                    <div className="mt-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lon}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline text-sm"
                      >
                        Open Navigation
                      </a>
                    </div>
                  )}
                  {order.delivery_notes && (
                    <p className="text-sm mt-2"><strong>Notes:</strong> {order.delivery_notes}</p>
                  )}
                </div>

                {/* Order Items */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-2">Order Items</h4>
                  <div className="space-y-1">
                    {order.order_items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.products.name} x{item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Estimated Delivery */}
                {order.estimated_delivery && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-1 flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Estimated Delivery</span>
                    </h4>
                    <p className="text-sm">
                      {new Date(order.estimated_delivery).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  {order.status === 'confirmed' || order.status === 'preparing' ? (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'out-for-delivery')}
                      className="flex-1"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Pick Up Order
                    </Button>
                  ) : order.status === 'out-for-delivery' ? (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Delivered
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'There are no orders to display.' 
                : `No orders with status: ${filter}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Delivery;