import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Truck, MapPin, UtensilsCrossed, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantOrderDetails {
  id: string;
  total_amount: number;
  status: string;
  delivery_address: string | null;
  created_at: string;
  estimated_delivery: string | null;
  notes: string | null;
  payment_method: string | null;
  restaurant_id: string;
  items: {
    quantity: number;
    price: number;
    restaurant_foods: {
      name: string;
      description: string | null;
    } | null;
  }[];
  restaurants: {
    name: string;
    address: string | null;
  };
}

const RestaurantOrderSuccess = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<RestaurantOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!orderId) {
      navigate('/');
      return;
    }

    fetchOrderDetails();
  }, [user, orderId, navigate]);

  const fetchOrderDetails = async () => {
    if (!orderId || !user) return;

    try {
      // First get the restaurant order
      const { data: orderData, error: orderError } = await supabase
        .from('restaurant_orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (orderError) throw orderError;

      // Then get the order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('restaurant_order_items')
        .select(`
          *,
          restaurant_foods (
            name,
            description
          )
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Get restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('name, address')
        .eq('id', orderData.restaurant_id)
        .single();

      if (restaurantError) throw restaurantError;

      // Combine the data
      const combinedData = {
        ...orderData,
        items: itemsData || [],
        restaurants: restaurantData || { name: 'Unknown Restaurant', address: null }
      };

      setOrder(combinedData);
    } catch (error) {
      console.error('Error fetching restaurant order:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedDeliveryTime = () => {
    if (order?.estimated_delivery) {
      return new Date(order.estimated_delivery).toLocaleString();
    }
    
    // Default to 30-45 minutes from order time
    const orderTime = new Date(order?.created_at || Date.now());
    const estimatedTime = new Date(orderTime.getTime() + 45 * 60 * 1000); // 45 minutes
    return estimatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Order not found</p>
            <Link to="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Restaurant Order Confirmed - HN Mart</title>
        <meta name="description" content="Your restaurant order has been confirmed on HN Mart. Track delivery and view order details." />
        <meta property="og:title" content="Restaurant Order Confirmed - HN Mart" />
        <meta property="og:description" content="Your restaurant order has been confirmed on HN Mart. Track delivery and view order details." />
        <meta property="og:url" content="https://hnmart.in/restaurant-order-success" />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-4">Restaurant Order Confirmed!</h1>
          <p className="text-muted-foreground mb-2">Thank you for your food order</p>
          <p className="text-sm text-muted-foreground">Order ID: #{order.id.slice(0, 8)}</p>
        </div>

        {/* Restaurant Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <UtensilsCrossed className="w-6 h-6 text-orange-500" />
              <div>
                <p className="font-semibold">{order.restaurants.name}</p>
                {order.restaurants.address && (
                  <p className="text-sm text-muted-foreground">{order.restaurants.address}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-semibold">Estimated Delivery</p>
                  <p className="text-sm text-muted-foreground">{getEstimatedDeliveryTime()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize text-green-600">{order.status}</p>
              </div>
            </div>
            
            {order.delivery_address && (
              <div className="flex items-start space-x-3 pt-4 border-t">
                <MapPin className="w-6 h-6 text-primary mt-1" />
                <div>
                  <p className="font-semibold">Delivery Address</p>
                  <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                </div>
              </div>
            )}

            {order.notes && (
              <div className="pt-4 border-t">
                <p className="font-semibold">Special Instructions</p>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <UtensilsCrossed className="w-5 h-5 mr-2" />
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">{item.restaurant_foods?.name || 'Item removed'}</p>
                      {item.restaurant_foods?.description && (
                        <p className="text-sm text-muted-foreground">{item.restaurant_foods.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount</span>
                <span>₹{Number(order.total_amount).toFixed(2)}</span>
              </div>
              {order.payment_method && (
                <p className="text-sm text-muted-foreground mt-2">
                  Payment: {order.payment_method === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Updates */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Truck className="w-5 h-5 mr-2" />
              Delivery Updates
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Order Confirmed</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="text-muted-foreground">Restaurant preparing your order</p>
                  <p className="text-sm text-muted-foreground">Usually takes 20-30 minutes</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="text-muted-foreground">Out for delivery</p>
                  <p className="text-sm text-muted-foreground">You'll receive SMS updates</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Need Help?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you have any questions about your restaurant order, feel free to contact our support team.
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Call Support
              </Button>
              <Button variant="outline" size="sm">
                Chat with Us
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link to="/profile?tab=orders" className="block">
            <Button variant="outline" size="lg" className="w-full">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Track Your Orders
            </Button>
          </Link>
          <Link to="/restaurants" className="block">
            <Button size="lg" className="w-full">
              Order More Food
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RestaurantOrderSuccess;
