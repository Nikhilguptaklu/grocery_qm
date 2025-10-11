import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { User, MapPin, Phone, Mail, Edit, Save, X, Package, CreditCard, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AddressPicker from '@/components/AddressPicker';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  role: string | null;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: string | null;
  payment_method?: string;
  order_items: {
    quantity: number;
    price: number;
    products: {
      name: string;
      image: string | null;
    };
  }[];
}

interface RestaurantOrder {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: string | null;
  payment_method?: string;
  notes: string | null;
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

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantOrders, setRestaurantOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  
  
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (user) {
      fetchProfile();
      fetchOrders();
      fetchRestaurantOrders();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;
      setProfile(data);
      setEditForm({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(quantity, price, products(name, image))`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) { console.error('Error fetching orders:', error); }
  };

  const fetchRestaurantOrders = async () => {
    if (!user) return;
    try {
      // Get restaurant orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('restaurant_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;

      // For each order, get the items and restaurant details
      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order) => {
          // Get order items
          const { data: itemsData } = await supabase
            .from('restaurant_order_items')
            .select(`
              *,
              restaurant_foods (
                name,
                description
              )
            `)
            .eq('order_id', order.id);

          // Get restaurant details
          const { data: restaurantData } = await supabase
            .from('restaurants')
            .select('name, address')
            .eq('id', order.restaurant_id)
            .single();

          return {
            ...order,
            items: itemsData || [],
            restaurants: restaurantData || { name: 'Unknown Restaurant', address: null }
          };
        })
      );

      setRestaurantOrders(ordersWithDetails);
    } catch (error) { console.error('Error fetching restaurant orders:', error); }
  };

  const updateProfile = async () => {
    if (!user || !profile) return;
    try {
      const { error } = await supabase.from('profiles').update({
        name: editForm.name,
        phone: editForm.phone
      }).eq('id', user.id);
      if (error) throw error;
      setProfile({ ...profile, name: editForm.name, phone: editForm.phone });
      setEditingProfile(false);
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  const updateAddress = async () => {
    if (!user || !profile) return;
    try {
      const { error } = await supabase.from('profiles').update({
        address: editForm.address
      }).eq('id', user.id);
      if (error) throw error;
      setProfile({ ...profile, address: editForm.address });
      setEditingAddress(false);
      toast({ title: "Success", description: "Address updated successfully" });
    } catch (error) {
      console.error('Error updating address:', error);
      toast({ title: "Error", description: "Failed to update address", variant: "destructive" });
    }
  };

  const handlePickAddress = (data: { lat: number; lon: number; address: string }) => {
    setEditForm(prev => ({ ...prev, address: data.address }));
    toast({ title: "Location selected", description: "Address set from map." });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'out-for-delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border border-gray-200">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 text-lg font-medium">Profile not found</p>
            <Link to="/"><Button className="mt-4 bg-green-500 hover:bg-green-600 text-white">Go Home</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 pb-10">
      <Helmet>
        <title>My Profile - HN Mart</title>
        <meta name="description" content="Manage your account, addresses and orders on HN Mart. View your order history and update profile information." />
        <meta property="og:title" content="My Profile - HN Mart" />
        <meta property="og:description" content="Manage your account and orders on HN Mart." />
  <meta property="og:url" content="https://hnmart.in/profile" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="My Profile - HN Mart" />
        <meta name="twitter:description" content="Manage your account and orders on HN Mart." />
        <script type="application/ld+json">
          {`{
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "${profile.name || ''}",
            "email": "${profile.email}",
            "jobTitle": "Customer",
            "url": "https://hnmart.in/profile"
          }`}
        </script>
      </Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-green-800 mb-1">My Profile</h1>
        <p className="text-green-700 mb-6">Manage your account and order history</p>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 rounded-lg bg-green-100 p-1">
            <TabsTrigger value="profile" className="rounded-lg hover:bg-green-200">Profile Info</TabsTrigger>
            <TabsTrigger value="address" className="rounded-lg hover:bg-green-200">Address</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg hover:bg-green-200">Order History</TabsTrigger>
          </TabsList>

          {/* Profile Info */}
          <TabsContent value="profile">
            <Card className="shadow-lg border border-gray-200 hover:shadow-2xl transition duration-300">
              <CardHeader className="flex justify-between items-center bg-green-100 p-4 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-green-800 font-semibold"><User className="w-5 h-5" /> Personal Info</CardTitle>
                <Button variant="outline" size="sm" onClick={() => { if(editingProfile){ setEditForm({name:profile.name||'', phone:profile.phone||'', address:profile.address||''}) } setEditingProfile(!editingProfile)}}>{editingProfile ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />} {editingProfile ? 'Cancel' : 'Edit'}</Button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <div><Label>Email</Label><div className="flex items-center space-x-2 mt-1"><Mail className="w-4 h-4 text-green-700" /><span className="text-green-900">{profile.email}</span></div></div>
                <div><Label>Role</Label><div className="flex items-center space-x-2 mt-1"><User className="w-4 h-4 text-green-700" /><span className="text-green-900 capitalize">{profile.role||'Customer'}</span></div></div>
                <div><Label>Full Name</Label>{editingProfile ? <Input value={editForm.name} onChange={(e)=>setEditForm({...editForm, name:e.target.value})} placeholder="Enter your name" /> : <span className="text-green-900">{profile.name||'Not provided'}</span>}</div>
                <div><Label>Phone</Label>{editingProfile ? <Input value={editForm.phone} onChange={(e)=>setEditForm({...editForm, phone:e.target.value})} placeholder="Enter your phone" /> : <span className="text-green-900">{profile.phone||'Not provided'}</span>}</div>
                {editingProfile && <div className="col-span-full flex justify-end"><Button onClick={updateProfile} className="bg-green-500 hover:bg-green-600 text-white"><Save className="w-4 h-4 mr-2" /> Save Changes</Button></div>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Address */}
          <TabsContent value="address">
            <Card className="shadow-lg border border-gray-200 hover:shadow-2xl transition duration-300">
              <CardHeader className="flex justify-between items-center bg-orange-100 p-4 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-orange-800 font-semibold"><MapPin className="w-5 h-5" /> Delivery Address</CardTitle>
                <Button variant="outline" size="sm" onClick={() => { if(editingAddress){ setEditForm(prev=>({...prev,address:profile.address||''})) } setEditingAddress(!editingAddress)}}>{editingAddress ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />} {editingAddress ? 'Cancel' : 'Edit'}</Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {editingAddress ? (
                  <>
                    <AddressPicker onSave={handlePickAddress} />
                    <div>
                      <Label>Address</Label>
                      <Input value={editForm.address} onChange={(e)=>setEditForm({...editForm,address:e.target.value})} placeholder="Enter your complete address" />
                    </div>
                    <div className="flex justify-end"><Button onClick={updateAddress} className="bg-orange-500 hover:bg-orange-600 text-white"><Save className="w-4 h-4 mr-2" /> Save Address</Button></div>
                  </>
                ) : (<span className="text-orange-900">{profile.address||'No address provided'}</span>)}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order History */}
          <TabsContent value="orders">
            <div className="space-y-6">
              {orders.length === 0 && restaurantOrders.length === 0 ? (
                <div className="text-center py-10 text-green-900">
                  <Package className="w-16 h-16 mx-auto mb-4" />
                  <p>No orders yet</p>
                  <Link to="/"><Button className="bg-green-500 hover:bg-green-600 text-white mt-4">Start Shopping</Button></Link>
                </div>
              ) : (
                <>
                  {/* Grocery Orders */}
                  {orders.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Package className="w-5 h-5 mr-2" />
                        Grocery Orders ({orders.length})
                      </h3>
                      <div className="space-y-4">
                        {orders.map(order => (
                          <Card key={order.id} className="shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-r from-green-50 to-blue-50">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <div className="bg-green-100 p-2 rounded-full">
                                      <Package className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-lg text-gray-800">Order #{order.id.slice(0,8)}</h3>
                                      <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}</p>
                                    </div>
                                  </div>
                                  
                                  {order.delivery_address && (
                                    <div className="flex items-start space-x-2 mb-3">
                                      <MapPin className="w-4 h-4 text-orange-500 mt-0.5" />
                                      <p className="text-sm text-gray-700">{order.delivery_address}</p>
                                    </div>
                                  )}

                                  {order.payment_method && (
                                    <div className="flex items-center space-x-2 mb-3">
                                      <CreditCard className="w-4 h-4 text-blue-500" />
                                      <span className="text-sm text-gray-700">
                                        Payment: {order.payment_method === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-right">
                                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                                    {order.status.replace('-',' ').toUpperCase()}
                                  </div>
                                  <div className="text-lg font-bold text-green-800 mt-2">₹{order.total_amount.toFixed(2)}</div>
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                                <div className="space-y-3">
                                  {order.order_items.map((item,index)=>(
                                    <div key={index} className="flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm border">
                                      {item.products.image && (
                                        <img 
                                          src={item.products.image} 
                                          alt={item.products.name} 
                                          className="w-12 h-12 rounded-lg object-cover border" 
                                        />
                                      )}
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-800">{item.products.name}</p>
                                        <p className="text-sm text-gray-600">Quantity: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-green-700">₹{(item.price*item.quantity).toFixed(2)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Restaurant Orders */}
                  {restaurantOrders.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <UtensilsCrossed className="w-5 h-5 mr-2" />
                        Restaurant Orders ({restaurantOrders.length})
                      </h3>
                      <div className="space-y-4">
                        {restaurantOrders.map(order => (
                          <Card key={order.id} className="shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-r from-orange-50 to-red-50">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <div className="bg-orange-100 p-2 rounded-full">
                                      <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-lg text-gray-800">Order #{order.id.slice(0,8)}</h3>
                                      <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2 mb-3">
                                    <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm text-gray-700 font-medium">{order.restaurants.name}</span>
                                  </div>
                                  
                                  {order.delivery_address && (
                                    <div className="flex items-start space-x-2 mb-3">
                                      <MapPin className="w-4 h-4 text-orange-500 mt-0.5" />
                                      <p className="text-sm text-gray-700">{order.delivery_address}</p>
                                    </div>
                                  )}

                                  {order.payment_method && (
                                    <div className="flex items-center space-x-2 mb-3">
                                      <CreditCard className="w-4 h-4 text-blue-500" />
                                      <span className="text-sm text-gray-700">
                                        Payment: {order.payment_method === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
                                      </span>
                                    </div>
                                  )}

                                  {order.notes && (
                                    <div className="mb-3">
                                      <p className="text-sm text-gray-600">
                                        <span className="font-medium">Notes:</span> {order.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-right">
                                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                                    {order.status.replace('-',' ').toUpperCase()}
                                  </div>
                                  <div className="text-lg font-bold text-orange-800 mt-2">₹{order.total_amount.toFixed(2)}</div>
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                                <div className="space-y-3">
                                  {order.items.map((item,index)=>(
                                    <div key={index} className="flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm border">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-800">{item.restaurant_foods?.name || 'Item removed'}</p>
                                        {item.restaurant_foods?.description && (
                                          <p className="text-sm text-gray-600">{item.restaurant_foods.description}</p>
                                        )}
                                        <p className="text-sm text-gray-600">Quantity: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-orange-700">₹{(item.price*item.quantity).toFixed(2)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
