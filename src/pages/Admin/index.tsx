import { Helmet } from 'react-helmet';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  ShoppingBag,
  CreditCard,
  Truck,
  MessageSquare,
  Users as UsersIcon,
  UtensilsCrossed,
  Receipt,
} from 'lucide-react';
import ProductsPage from './ProductsPage';
import OrdersPage from './OrdersPage';
import CouponsPage from './CouponsPage';
import DeliveryPage from './DeliveryPage';
import IssuesPage from './IssuesPage';
import UsersPage from './UsersPage';
import RestaurantsPage from './RestaurantsPage';
import RestaurantOrdersPage from './RestaurantOrdersPage';
import type {
  AdminUser,
  Coupon,
  DeliverySettings,
  Issue,
  Order,
  Product,
  Restaurant,
  RestaurantFood,
  RestaurantOrder,
} from './types';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantFoods, setRestaurantFoods] = useState<RestaurantFood[]>([]);
  const [restaurantOrders, setRestaurantOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Products fetch error:', productsError);
      } else {
        setProducts(productsData || []);
      }

      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (issuesError) {
        console.error('Issues fetch error:', issuesError);
        setIssues([]);
      } else if (issuesData && issuesData.length > 0) {
        const issueUserIds = [...new Set(issuesData.map((issue) => issue.user_id))];
        const { data: issueProfilesData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', issueUserIds);

        const issuesWithProfiles = issuesData.map((issue) => ({
          ...issue,
          profiles: issueProfilesData?.find((profile) => profile.id === issue.user_id) || null,
        }));

        setIssues(issuesWithProfiles as unknown as Issue[]);
      } else {
        setIssues([]);
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(
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
        )
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
        setOrders([]);
      } else if (ordersData && ordersData.length > 0) {
        const userIds = [...new Set(ordersData.map((order) => order.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);

        const orderIds = ordersData.map((order) => order.id);
        const { data: orderItemsData, error: orderItemsError } = await supabase
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

        const ordersWithDetails = ordersData.map((order) => ({
          ...order,
          profiles: profilesData?.find((profile) => profile.id === order.user_id) || null,
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

        setOrders(ordersWithDetails as unknown as Order[]);
      } else {
        setOrders([]);
      }

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Users fetch error:', usersError);
        setUsers([]);
      } else {
        setUsers((usersData as unknown as AdminUser[]) || []);
      }

      const { data: couponsDataRaw, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (couponsError) {
        console.error('Coupons fetch error:', couponsError);
        setCoupons([]);
      } else {
        const couponsData = couponsDataRaw as Database['public']['Tables']['coupons']['Row'][] | null;
        setCoupons((couponsData as unknown as Coupon[]) || []);
      }

      const { data: deliveryData, error: deliveryError } = await supabase
        .from('delivery_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (deliveryError) {
        console.error('Delivery settings fetch error:', deliveryError);
        setDeliverySettings([]);
      } else {
        setDeliverySettings((deliveryData as unknown as DeliverySettings[]) || []);
      }

      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (restaurantsError) {
        console.error('Restaurants fetch error:', restaurantsError);
        setRestaurants([]);
      } else {
        setRestaurants((restaurantsData as unknown as Restaurant[]) || []);
      }

      const { data: restaurantFoodsData, error: restaurantFoodsError } = await supabase
        .from('restaurant_foods')
        .select('*')
        .order('created_at', { ascending: false });

      let typedRestaurantFoods: RestaurantFood[] = [];

      if (restaurantFoodsError) {
        console.error('Restaurant foods fetch error:', restaurantFoodsError);
        setRestaurantFoods([]);
      } else {
        typedRestaurantFoods = (restaurantFoodsData as unknown as RestaurantFood[]) || [];
        setRestaurantFoods(typedRestaurantFoods);
      }

      const { data: restaurantOrdersData, error: restaurantOrdersError } = await supabase
        .from('restaurant_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (restaurantOrdersError) {
        console.error('Restaurant orders fetch error:', restaurantOrdersError);
        setRestaurantOrders([]);
      } else if (restaurantOrdersData && restaurantOrdersData.length > 0) {
        const restaurantOrderUserIds = [
          ...new Set(restaurantOrdersData.map((order) => order.user_id)),
        ];

        const { data: restaurantOrderProfilesData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', restaurantOrderUserIds);

        const orderIds = restaurantOrdersData.map((order) => order.id);
        let restaurantOrderItemsData:
          | {
              id: string;
              order_id: string;
              restaurant_food_id: string;
              quantity: number;
              price: number;
            }[]
          | null = null;

        if (orderIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from('restaurant_order_items')
            .select('id, order_id, restaurant_food_id, quantity, price')
            .in('order_id', orderIds);

          if (itemsError) {
            console.error('Restaurant order items fetch error:', itemsError);
          } else {
            restaurantOrderItemsData = itemsData ?? null;
          }
        }

        const foodsMap = new Map(typedRestaurantFoods.map((food) => [food.id, food]));

        const ordersWithExtras = restaurantOrdersData.map((order) => ({
          ...order,
          profiles:
            restaurantOrderProfilesData?.find((profile) => profile.id === order.user_id) || null,
          items:
            restaurantOrderItemsData
              ?.filter((item) => item.order_id === order.id)
              .map((item) => ({
                ...item,
                food: foodsMap.get(item.restaurant_food_id) || null,
              })) || [],
        }));

        setRestaurantOrders(ordersWithExtras as unknown as RestaurantOrder[]);
      } else {
        setRestaurantOrders([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data from the database.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const checkAdminAccess = useCallback(async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to check user permissions.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      if (!profile || profile.role !== 'admin') {
        toast({
          title: 'Access denied',
          description: "You don't have admin privileges.",
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      await fetchData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast({
        title: 'Error',
        description: 'Authentication error occurred.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [fetchData, navigate, toast, user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    void checkAdminAccess();
  }, [authLoading, checkAdminAccess]);

  const deliveryUsers = users.filter((u) => u.role === 'delivery' || u.role === 'admin');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Admin Dashboard | HN Mart</title>
        <meta
          name="description"
          content="Manage products, orders, coupons, and users at HN Mart. Admin dashboard for grocery store management."
        />
        <meta
          name="keywords"
          content="hnmart, admin, dashboard, product management, orders, coupons, users, grocery"
        />
        <meta property="og:title" content="Admin Dashboard | HN Mart" />
        <meta
          property="og:description"
          content="Manage products, orders, coupons, and users at HN Mart. Admin dashboard for grocery store management."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/public/favicon.ico" />
        <meta property="og:url" content="https://hnmart.in/admin" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your grocery store</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Products ({products.length})</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Orders ({orders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex items-center space-x-2">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Restaurants ({restaurants.length})</span>
            </TabsTrigger>
            <TabsTrigger value="restaurantOrders" className="flex items-center space-x-2">
              <Receipt className="w-4 h-4" />
              <span>Food Orders ({restaurantOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Coupons ({coupons.length})</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center space-x-2">
              <Truck className="w-4 h-4" />
              <span>Delivery ({deliverySettings.length})</span>
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Issues ({issues.length})</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <UsersIcon className="w-4 h-4" />
              <span>Users ({users.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsPage products={products} onRefresh={fetchData} currentUserId={user?.id} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersPage orders={orders} deliveryUsers={deliveryUsers} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="restaurants">
            <RestaurantsPage restaurants={restaurants} foods={restaurantFoods} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="restaurantOrders">
            <RestaurantOrdersPage orders={restaurantOrders} restaurants={restaurants} deliveryUsers={deliveryUsers} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="coupons">
            <CouponsPage coupons={coupons} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="delivery">
            <DeliveryPage deliverySettings={deliverySettings} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="issues">
            <IssuesPage issues={issues} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="users">
            <UsersPage users={users} onRefresh={fetchData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
