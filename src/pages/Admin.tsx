import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
import { Plus, Edit, Trash2, Users, Package, MessageSquare, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';

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
  profiles?: { name: string; email: string } | null;
  order_items?: OrderItem[];
}

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

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
          user_id
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

        setOrders(ordersWithDetails as unknown as Order[]);
      } else {
        setOrders([]);
      }

      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your grocery store</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Products ({products.length})</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Orders ({orders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Issues ({issues.length})</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Users</span>
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
            {orders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                  <p className="text-muted-foreground">Orders will appear here once customers start placing them.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
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
                          {order.order_items && order.order_items.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Items: {order.order_items.length} product{order.order_items.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">₹{order.total_amount.toFixed(2)}</p>
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

                      <div className="flex space-x-2">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
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
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">User Management</h3>
                <p className="text-muted-foreground">User management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;