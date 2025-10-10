import { Helmet } from 'react-helmet';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Users, Package, MessageSquare, ShoppingBag, ChevronDown, ChevronUp, CreditCard, Truck } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  created_at?: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  user_id: string;
  admin_notes?: string;
  profiles?: { name: string; email: string } | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: string;
  user_id: string;
  delivery_person_id?: string | null;
  payment_method?: string;
  profiles?: { name: string; email: string } | null;
  order_items?: OrderItem[];
}

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  role: 'admin' | 'customer' | 'delivery';
  status: string | null;
  created_at: string;
  updated_at: string;
}

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  created_at: string;
}

interface DeliverySettings {
  id: string;
  free_delivery_threshold: number;
  delivery_fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const deliveryUsers = users.filter(u => u.role === 'delivery' || u.role === 'admin');
  const [selectedStatusByOrder, setSelectedStatusByOrder] = useState<Record<string, string>>({});
  const [selectedDeliveryByOrder, setSelectedDeliveryByOrder] = useState<Record<string, string | null>>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: ''
  });
  
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);

  // Coupon form state
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    valid_from: '',
    valid_until: ''
  });
  const [editingCoupon, setEditingCoupon] = useState<string | null>(null);
  const [showCouponDialog, setShowCouponDialog] = useState(false);

  // Delivery settings form state
  const [deliveryForm, setDeliveryForm] = useState({
    free_delivery_threshold: '',
    delivery_fee: '',
    is_active: true
  });
  const [editingDelivery, setEditingDelivery] = useState<string | null>(null);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    checkAdminAccess();
  }, [user, authLoading]);

  const toggleOrderExpansion = (orderId: string) => {
    const newExpandedOrders = new Set(expandedOrders);
    if (newExpandedOrders.has(orderId)) {
      newExpandedOrders.delete(orderId);
    } else {
      newExpandedOrders.add(orderId);
    }
    setExpandedOrders(newExpandedOrders);
  };

  const checkAdminAccess = async () => {
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
          title: "Error",
          description: "Failed to check user permissions.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      if (!profile || profile.role !== 'admin') {
        toast({
          title: "Access denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      await fetchData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast({
        title: "Error",
        description: "Authentication error occurred.",
        variant: "destructive",
      });
      navigate('/');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch products with better error handling
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Products fetch error:', productsError);
      } else {
        setProducts(productsData || []);
      }

      // Fetch issues with user profiles - Fixed query
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      // If issues exist, fetch user profiles separately
      if (issuesData && issuesData.length > 0) {
        const issueUserIds = [...new Set(issuesData.map(issue => issue.user_id))];
        const { data: issueProfilesData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', issueUserIds);

        // Map profiles to issues
        const issuesWithProfiles = issuesData.map(issue => ({
          ...issue,
          profiles: issueProfilesData?.find(profile => profile.id === issue.user_id) || null
        }));

        setIssues(issuesWithProfiles as unknown as Issue[]);
      } else {
        setIssues([]);
      }

      if (issuesError) {
        console.error('Issues fetch error:', issuesError);
      }

      // Fetch orders with user profiles and order items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          delivery_address,
          delivery_person_id,
          user_id,
          payment_method
        `)
        .order('created_at', { ascending: false });

      if (ordersData && ordersData.length > 0) {
        // Fetch user profiles
        const userIds = [...new Set(ordersData.map(order => order.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);

        // Fetch order items with product details
        const orderIds = ordersData.map(order => order.id);
        const { data: orderItemsData, error: orderItemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            order_id,
            quantity,
            price,
            products:product_id (
              id,
              name,
              image
            )
          `)
          .in('order_id', orderIds);

        if (orderItemsError) {
          console.error('Order items fetch error:', orderItemsError);
        }

        // Map profiles and order items to orders
        const ordersWithDetails = ordersData.map(order => ({
          ...order,
          profiles: profilesData?.find(profile => profile.id === order.user_id) || null,
          order_items: orderItemsData?.filter(item => item.order_id === order.id).map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            product: {
              id: item.products?.id || '',
              name: item.products?.name || 'Unknown Product',
              image: item.products?.image || null
            }
          })) || []
        }));

        const finalOrders = ordersWithDetails as unknown as Order[];
        setOrders(finalOrders);
        // Initialize selections for submit controls
        const initialStatus: Record<string, string> = {};
        const initialDelivery: Record<string, string | null> = {};
        finalOrders.forEach(o => { initialStatus[o.id] = o.status; initialDelivery[o.id] = o.delivery_person_id || null; });
        setSelectedStatusByOrder(initialStatus);
        setSelectedDeliveryByOrder(initialDelivery);
      } else {
        setOrders([]);
      }

      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
      }

      // Fetch all users (profiles)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Users fetch error:', usersError);
      } else {
        setUsers(usersData as User[] || []);
      }

      // Fetch coupons
      const { data: couponsDataRaw, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      const couponsData = couponsDataRaw as Database['public']['Tables']['coupons']['Row'][] | null;

      if (couponsError) {
        console.error('Coupons fetch error:', couponsError);
      } else {
  setCoupons((couponsData as unknown as Coupon[]) || []);
      }

      // Fetch delivery settings
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('delivery_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (deliveryError) {
        console.error('Delivery settings fetch error:', deliveryError);
      } else {
        setDeliverySettings((deliveryData as unknown as DeliverySettings[]) || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data from the database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      image: ''
    });
    setEditingProduct(null);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form data
      if (!productForm.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Product name is required.",
          variant: "destructive",
        });
        return;
      }

      if (!productForm.price || isNaN(parseFloat(productForm.price)) || parseFloat(productForm.price) <= 0) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid price.",
          variant: "destructive",
        });
        return;
      }

      if (!productForm.stock || isNaN(parseInt(productForm.stock)) || parseInt(productForm.stock) < 0) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid stock quantity.",
          variant: "destructive",
        });
        return;
      }

      if (!productForm.category) {
        toast({
          title: "Validation Error",
          description: "Please select a category.",
          variant: "destructive",
        });
        return;
      }

      const productData = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: parseFloat(productForm.price),
        category: productForm.category,
        stock: parseInt(productForm.stock),
        image: productForm.image.trim() || null,
        created_by: user.id // Add the user ID for RLS
      };

      let error;

      if (editingProduct) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);
        error = insertError;
      }

      if (error) {
        console.error('Database operation error:', error);
        toast({
          title: "Database Error",
          description: `Failed to ${editingProduct ? 'update' : 'create'} product: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Product ${editingProduct ? 'updated' : 'created'} successfully.`,
      });

      resetProductForm();
      setShowProductDialog(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the product.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateIssue = async (issueId: string, status: string, adminNotes?: string) => {
    try {
      const updateData: any = { status };
      if (adminNotes) updateData.admin_notes = adminNotes;
      if (status === 'resolved') updateData.resolved_at = new Date().toISOString();

      const { error } = await supabase
        .from('issues')
        .update(updateData)
        .eq('id', issueId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Issue updated successfully.",
      });
      await fetchData();
    } catch (error: any) {
      console.error('Error updating issue:', error);
      toast({
        title: "Error",
        description: `Failed to update issue: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Order status updated successfully.",
      });
      await fetchData();
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: `Failed to update order status: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleAssignDelivery = async (orderId: string, deliveryUserId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_person_id: deliveryUserId, status: 'out-for-delivery', estimated_delivery: new Date(Date.now() + 60 * 60 * 1000).toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Assigned",
        description: "Delivery person assigned and order marked out for delivery.",
      });
      await fetchData();
    } catch (error: any) {
      console.error('Error assigning delivery:', error);
      toast({
        title: "Error",
        description: `Failed to assign delivery: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleSubmitOrderChanges = async (orderId: string) => {
    const status = selectedStatusByOrder[orderId];
    const deliveryUserId = selectedDeliveryByOrder[orderId] || null;
    try {
      const updateData: any = { status };
      if (deliveryUserId) {
        updateData.delivery_person_id = deliveryUserId;
        if (status === 'out-for-delivery') {
          updateData.estimated_delivery = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        }
      } else {
        updateData.delivery_person_id = null;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast({ title: 'Saved', description: 'Order changes applied.' });
      await fetchData();
    } catch (error: any) {
      console.error('Error saving order changes:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save changes', variant: 'destructive' });
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status } as any)
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `User ${status === 'blocked' ? 'blocked' : 'activated'} successfully.`,
      });
      await fetchData();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: `Failed to update user status: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Coupon management functions
  const resetCouponForm = () => {
    setCouponForm({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount_amount: '',
      usage_limit: '',
      valid_from: '',
      valid_until: ''
    });
    setEditingCoupon(null);
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!couponForm.code.trim()) {
        toast({
          title: "Validation Error",
          description: "Coupon code is required.",
          variant: "destructive",
        });
        return;
      }

      const couponData = {
        code: couponForm.code.trim().toUpperCase(),
        description: couponForm.description.trim(),
        discount_type: couponForm.discount_type,
        discount_value: parseFloat(couponForm.discount_value),
        min_order_amount: couponForm.min_order_amount ? parseFloat(couponForm.min_order_amount) : null,
        max_discount_amount: couponForm.max_discount_amount ? parseFloat(couponForm.max_discount_amount) : null,
        usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
        valid_from: couponForm.valid_from || new Date().toISOString(),
        valid_until: couponForm.valid_until,
        is_active: true,
        used_count: 0
      };

      let error;
      if (editingCoupon) {
        const { error: updateError } = await supabase
          .from('coupons')
          .update(couponData as Database['public']['Tables']['coupons']['Update'])
          .eq('id', editingCoupon);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('coupons')
          .insert([couponData as Database['public']['Tables']['coupons']['Insert']]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Coupon ${editingCoupon ? 'updated' : 'created'} successfully.`,
      });

      resetCouponForm();
      setShowCouponDialog(false);
      await fetchData();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast({
        title: "Error",
        description: `Failed to save coupon: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Coupon deleted successfully.",
      });
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      toast({
        title: "Error",
        description: `Failed to delete coupon: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleToggleCouponStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !isActive } as Database['public']['Tables']['coupons']['Update'])
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Coupon ${!isActive ? 'activated' : 'deactivated'} successfully.`,
      });
      await fetchData();
    } catch (error: any) {
      console.error('Error updating coupon status:', error);
      toast({
        title: "Error",
        description: `Failed to update coupon status: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Delivery settings management functions
  const resetDeliveryForm = () => {
    setDeliveryForm({
      free_delivery_threshold: '',
      delivery_fee: '',
      is_active: true
    });
    setEditingDelivery(null);
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!deliveryForm.free_delivery_threshold || !deliveryForm.delivery_fee) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const deliveryData = {
        free_delivery_threshold: parseFloat(deliveryForm.free_delivery_threshold),
        delivery_fee: parseFloat(deliveryForm.delivery_fee),
        is_active: deliveryForm.is_active
      };

      let error;
      if (editingDelivery) {
        const { error: updateError } = await supabase
          .from('delivery_settings')
          .update(deliveryData)
          .eq('id', editingDelivery);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('delivery_settings')
          .insert([deliveryData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Delivery settings ${editingDelivery ? 'updated' : 'created'} successfully.`,
      });

      resetDeliveryForm();
      setShowDeliveryDialog(false);
      await fetchData();
    } catch (error: any) {
      console.error('Error saving delivery settings:', error);
      toast({
        title: "Error",
        description: `Failed to save delivery settings: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDelivery = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery setting?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('delivery_settings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Delivery setting deleted successfully.",
      });
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting delivery setting:', error);
      toast({
        title: "Error",
        description: `Failed to delete delivery setting: ${error.message}`,
        variant: "destructive",
      });
    }
  };

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
        <meta name="description" content="Manage products, orders, coupons, and users at HN Mart. Admin dashboard for grocery store management." />
        <meta name="keywords" content="hnmart, admin, dashboard, product management, orders, coupons, users, grocery" />
        <meta property="og:title" content="Admin Dashboard | HN Mart" />
        <meta property="og:description" content="Manage products, orders, coupons, and users at HN Mart. Admin dashboard for grocery store management." />
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Products ({products.length})</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Orders ({orders.length})</span>
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
              <Users className="w-4 h-4" />
              <span>Users ({users.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Products Management</h2>
              <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetProductForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        required
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={productForm.description}
                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                        placeholder="Enter product description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={productForm.category}
                        onValueChange={(value) => setProductForm({...productForm, category: value})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fruits">Fruits</SelectItem>
                          <SelectItem value="vegetables">Vegetables</SelectItem>
                          <SelectItem value="cold-drinks">Cold Drinks</SelectItem>
                          <SelectItem value="grocery">Grocery</SelectItem>
                          <SelectItem value="dairy">Dairy</SelectItem>
                          <SelectItem value="meat">Meat</SelectItem>
                          <SelectItem value="bakery">Bakery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="stock">Stock *</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                        required
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="image">Image URL</Label>
                      <Input
                        id="image"
                        type="url"
                        value={productForm.image}
                        onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {products.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4">Start by adding your first product to the inventory.</p>
                  <Button onClick={() => setShowProductDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Product
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-md mb-4"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold">₹{product.price.toFixed(2)}</span>
                        <div className="flex gap-2">
                          <Badge variant="secondary">Stock: {product.stock}</Badge>
                          <Badge variant="outline" className="capitalize">{product.category}</Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setProductForm({
                              name: product.name,
                              description: product.description || '',
                              price: product.price.toString(),
                              category: product.category,
                              stock: product.stock.toString(),
                              image: product.image || ''
                            });
                            setEditingProduct(product.id);
                            setShowProductDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-semibold">Orders Management</h2>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              {/* Status filter with counts */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const counts = orders.reduce((acc: Record<string, number>, o) => {
                        acc[o.status] = (acc[o.status] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      const total = orders.length;
                      return (
                        <>
                          <SelectItem value="all">All ({total})</SelectItem>
                          <SelectItem value="pending">Pending ({counts['pending'] || 0})</SelectItem>
                          <SelectItem value="confirmed">Confirmed ({counts['confirmed'] || 0})</SelectItem>
                          <SelectItem value="out-for-delivery">Out for Delivery ({counts['out-for-delivery'] || 0})</SelectItem>
                          <SelectItem value="delivered">Delivered ({counts['delivered'] || 0})</SelectItem>
                          <SelectItem value="cancelled">Cancelled ({counts['cancelled'] || 0})</SelectItem>
                        </>
                      );
                    })()}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee filter with counts */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Assigned to</span>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const countsByAssignee = orders.reduce((acc: Record<string, number>, o) => {
                        if (o.delivery_person_id) acc[o.delivery_person_id] = (acc[o.delivery_person_id] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      return (
                        <>
                          <SelectItem value="all">All</SelectItem>
                          {deliveryUsers.map(du => (
                            <SelectItem key={du.id} value={du.id}>
                              {(du.name || du.email) + (du.role === 'admin' ? ' (Admin)' : '')} ({countsByAssignee[du.id] || 0})
                            </SelectItem>
                          ))}
                        </>
                      );
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(() => {
              const filtered = orders.filter(o => {
                const statusOk = statusFilter === 'all' || o.status === statusFilter;
                const assigneeOk = assigneeFilter === 'all' || o.delivery_person_id === assigneeFilter;
                return statusOk && assigneeOk;
              });
              return filtered.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                  <p className="text-muted-foreground">Orders will appear here once customers start placing them.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filtered.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleOrderExpansion(order.id)}
                              className="p-1 h-6 w-6"
                            >
                              {expandedOrders.has(order.id) ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                              }
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Customer: {order.profiles?.name || 'Unknown'} ({order.profiles?.email || 'No email'})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Address: {order.delivery_address}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Date: {new Date(order.created_at).toLocaleDateString()}
                          </p>
                          {order.payment_method && (
                            <div className="flex items-center space-x-2">
                              <CreditCard className="w-4 h-4 text-blue-500" />
                              <p className="text-sm text-muted-foreground">
                                Payment: {order.payment_method === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
                              </p>
                            </div>
                          )}
                          {order.order_items && order.order_items.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Items: {order.order_items.length} product{order.order_items.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">₹{Number(order.total_amount).toFixed(2)}</p>
                          {order.payment_method && (
                            <div className="flex items-center justify-end space-x-1 mb-2">
                              <CreditCard className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-muted-foreground">
                                {order.payment_method === 'card' ? 'Card' : 'Cash'}
                              </span>
                            </div>
                          )}
                          <Badge 
                            variant={
                              order.status === 'delivered' ? 'default' :
                              order.status === 'out-for-delivery' ? 'secondary' :
                              order.status === 'confirmed' ? 'outline' : 'destructive'
                            }
                            className="capitalize"
                          >
                            {order.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Order Items Details */}
                      {expandedOrders.has(order.id) && order.order_items && order.order_items.length > 0 && (
                        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-3">Order Items:</h4>
                          <div className="space-y-3">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                                <div className="flex items-center space-x-3">
                                  {item.product.image && (
                                    <img
                                      src={item.product.image}
                                      alt={item.product.name}
                                      className="w-12 h-12 object-cover rounded-md"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{item.product.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Quantity: {item.quantity} × ₹{item.price.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">₹{(item.quantity * item.price).toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <div className="flex gap-2">
                          <Select
                            value={selectedStatusByOrder[order.id] ?? order.status}
                            onValueChange={(value) => setSelectedStatusByOrder(prev => ({ ...prev, [order.id]: value }))}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>

                          {deliveryUsers.length > 0 && (
                            <Select
                              value={selectedDeliveryByOrder[order.id] ?? order.delivery_person_id ?? undefined as unknown as string}
                              onValueChange={(deliveryUserId) => setSelectedDeliveryByOrder(prev => ({ ...prev, [order.id]: deliveryUserId }))}
                            >
                              <SelectTrigger className="w-56">
                                <SelectValue placeholder="Assign delivery person" />
                              </SelectTrigger>
                              <SelectContent>
                                {deliveryUsers.map((du) => (
                                  <SelectItem key={du.id} value={du.id}>
                                    {(du.name || du.email) + (du.role === 'admin' ? ' (Admin)' : '')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleSubmitOrderChanges(order.id)}>Submit</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
            })()}
          </TabsContent>

          <TabsContent value="coupons" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Coupon Management</h2>
              <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetCouponForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Coupon
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCouponSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="code">Coupon Code *</Label>
                        <Input
                          id="code"
                          value={couponForm.code}
                          onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                          required
                          placeholder="SAVE20"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={couponForm.description}
                          onChange={(e) => setCouponForm({...couponForm, description: e.target.value})}
                          placeholder="20% off on all items"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discount_type">Discount Type *</Label>
                        <Select
                          value={couponForm.discount_type}
                          onValueChange={(value: 'percentage' | 'fixed') => setCouponForm({...couponForm, discount_type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="discount_value">Discount Value *</Label>
                        <Input
                          id="discount_value"
                          type="number"
                          step="0.01"
                          min="0"
                          value={couponForm.discount_value}
                          onChange={(e) => setCouponForm({...couponForm, discount_value: e.target.value})}
                          required
                          placeholder={couponForm.discount_type === 'percentage' ? '20' : '50'}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min_order_amount">Minimum Order Amount</Label>
                        <Input
                          id="min_order_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={couponForm.min_order_amount}
                          onChange={(e) => setCouponForm({...couponForm, min_order_amount: e.target.value})}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_discount_amount">Max Discount Amount</Label>
                        <Input
                          id="max_discount_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={couponForm.max_discount_amount}
                          onChange={(e) => setCouponForm({...couponForm, max_discount_amount: e.target.value})}
                          placeholder="200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="usage_limit">Usage Limit</Label>
                        <Input
                          id="usage_limit"
                          type="number"
                          min="1"
                          value={couponForm.usage_limit}
                          onChange={(e) => setCouponForm({...couponForm, usage_limit: e.target.value})}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="valid_from">Valid From</Label>
                        <Input
                          id="valid_from"
                          type="datetime-local"
                          value={couponForm.valid_from}
                          onChange={(e) => setCouponForm({...couponForm, valid_from: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="valid_until">Valid Until *</Label>
                        <Input
                          id="valid_until"
                          type="datetime-local"
                          value={couponForm.valid_until}
                          onChange={(e) => setCouponForm({...couponForm, valid_until: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {coupons.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No coupons found</h3>
                  <p className="text-muted-foreground mb-4">Start by creating your first coupon to offer discounts to customers.</p>
                  <Button onClick={() => setShowCouponDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Coupon
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                  <Card key={coupon.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{coupon.code}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{coupon.description}</p>
                        </div>
                        <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Discount:</span>
                          <span className="font-medium">
                            {coupon.discount_type === 'percentage' 
                              ? `${coupon.discount_value}%` 
                              : `₹${coupon.discount_value}`
                            }
                          </span>
                        </div>
                        {coupon.min_order_amount && (
                          <div className="flex justify-between text-sm">
                            <span>Min Order:</span>
                            <span>₹{coupon.min_order_amount}</span>
                          </div>
                        )}
                        {coupon.max_discount_amount && (
                          <div className="flex justify-between text-sm">
                            <span>Max Discount:</span>
                            <span>₹{coupon.max_discount_amount}</span>
                          </div>
                        )}
                        {coupon.usage_limit && (
                          <div className="flex justify-between text-sm">
                            <span>Usage:</span>
                            <span>{coupon.used_count}/{coupon.usage_limit}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span>Valid Until:</span>
                          <span>{new Date(coupon.valid_until).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCouponForm({
                              code: coupon.code,
                              description: coupon.description,
                              discount_type: coupon.discount_type,
                              discount_value: coupon.discount_value.toString(),
                              min_order_amount: coupon.min_order_amount?.toString() || '',
                              max_discount_amount: coupon.max_discount_amount?.toString() || '',
                              usage_limit: coupon.usage_limit?.toString() || '',
                              valid_from: coupon.valid_from,
                              valid_until: coupon.valid_until
                            });
                            setEditingCoupon(coupon.id);
                            setShowCouponDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleCouponStatus(coupon.id, coupon.is_active)}
                        >
                          {coupon.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="delivery" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Delivery Fee Management</h2>
              <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetDeliveryForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Delivery Setting
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingDelivery ? 'Edit Delivery Setting' : 'Add New Delivery Setting'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleDeliverySubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="free_delivery_threshold">Free Delivery Threshold (₹) *</Label>
                      <Input
                        id="free_delivery_threshold"
                        type="number"
                        step="0.01"
                        min="0"
                        value={deliveryForm.free_delivery_threshold}
                        onChange={(e) => setDeliveryForm({...deliveryForm, free_delivery_threshold: e.target.value})}
                        required
                        placeholder="500.00"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Orders above this amount get free delivery
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="delivery_fee">Delivery Fee (₹) *</Label>
                      <Input
                        id="delivery_fee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={deliveryForm.delivery_fee}
                        onChange={(e) => setDeliveryForm({...deliveryForm, delivery_fee: e.target.value})}
                        required
                        placeholder="50.00"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Standard delivery fee for orders below threshold
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="is_active"
                        type="checkbox"
                        checked={deliveryForm.is_active}
                        onChange={(e) => setDeliveryForm({...deliveryForm, is_active: e.target.checked})}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : (editingDelivery ? 'Update Setting' : 'Add Setting')}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {deliverySettings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No delivery settings found</h3>
                  <p className="text-muted-foreground mb-4">Start by adding your first delivery setting to manage delivery fees.</p>
                  <Button onClick={() => setShowDeliveryDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Delivery Setting
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deliverySettings.map((setting) => (
                  <Card key={setting.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">Delivery Setting</h3>
                          <Badge variant={setting.is_active ? 'default' : 'secondary'}>
                            {setting.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Free Delivery Threshold:</span>
                          <span className="font-medium">₹{setting.free_delivery_threshold}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Delivery Fee:</span>
                          <span className="font-medium">₹{setting.delivery_fee}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Orders above ₹{setting.free_delivery_threshold} get free delivery, 
                          otherwise ₹{setting.delivery_fee} delivery fee applies.
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDeliveryForm({
                              free_delivery_threshold: setting.free_delivery_threshold.toString(),
                              delivery_fee: setting.delivery_fee.toString(),
                              is_active: setting.is_active
                            });
                            setEditingDelivery(setting.id);
                            setShowDeliveryDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteDelivery(setting.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="issues" className="space-y-6">
            <h2 className="text-2xl font-semibold">Customer Issues</h2>
            {issues.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No issues reported</h3>
                  <p className="text-muted-foreground">Customer support issues will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {issues.map((issue) => (
                  <Card key={issue.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{issue.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Customer: {issue.profiles?.name || 'Unknown'} ({issue.profiles?.email || 'No email'})
                          </p>
                          <p className="text-sm mt-2">{issue.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Created: {new Date(issue.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge 
                            variant={
                              issue.status === 'resolved' ? 'default' :
                              issue.status === 'in-progress' ? 'secondary' : 'outline'
                            }
                            className="capitalize"
                          >
                            {issue.status.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className="capitalize">{issue.priority}</Badge>
                        </div>
                      </div>
                      {issue.admin_notes && (
                        <div className="mb-4 p-3 bg-muted rounded-md">
                          <p className="text-sm"><strong>Admin Notes:</strong> {issue.admin_notes}</p>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <Select
                          value={issue.status}
                          onValueChange={(value) => handleUpdateIssue(issue.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const notes = prompt('Add admin notes:');
                            if (notes) {
                              handleUpdateIssue(issue.id, issue.status, notes);
                            }
                          }}
                        >
                          Add Notes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <h2 className="text-2xl font-semibold">Users Management</h2>
            {users.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No users found</h3>
                  <p className="text-muted-foreground">Registered users will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{user.name || 'No Name'}</h3>
                            <Badge 
                              variant={user.role === 'admin' ? 'default' : user.role === 'delivery' ? 'secondary' : 'outline'}
                              className="capitalize"
                            >
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Email: {user.email}
                          </p>
                          {user.phone && (
                            <p className="text-sm text-muted-foreground mb-1">
                              Phone: {user.phone}
                            </p>
                          )}
                          {user.address && (
                            <p className="text-sm text-muted-foreground mb-1">
                              Address: {user.address}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge 
                            variant={user.status === 'blocked' ? 'destructive' : 'default'}
                            className="capitalize"
                          >
                            {user.status || 'active'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4">
                        {user.status !== 'blocked' ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to block ${user.name || user.email}? They won't be able to login.`)) {
                                handleUpdateUserStatus(user.id, 'blocked');
                              }
                            }}
                          >
                            Block User
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to activate ${user.name || user.email}?`)) {
                                handleUpdateUserStatus(user.id, 'active');
                              }
                            }}
                          >
                            Activate User
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;