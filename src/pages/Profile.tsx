import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, MapPin, Phone, Mail, Edit, Save, X, Package, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MappLsMap from '@/components/MappLsMap';

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
  order_items: {
    quantity: number;
    price: number;
    products: {
      name: string;
      image: string | null;
    };
  }[];
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  
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
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      setEditForm({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            products (
              name,
              image
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const updateProfile = async () => {
    if (!user || !profile) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          phone: editForm.phone
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setProfile({ ...profile, name: editForm.name, phone: editForm.phone });
      setEditingProfile(false);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const updateAddress = async () => {
    if (!user || !profile) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          address: editForm.address
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setProfile({ ...profile, address: editForm.address });
      setEditingAddress(false);
      
      toast({
        title: "Success",
        description: "Address updated successfully",
      });
    } catch (error) {
      console.error('Error updating address:', error);
      toast({
        title: "Error",
        description: "Failed to update address",
        variant: "destructive",
      });
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        setCoordinates(coords);
        reverseGeocodeMappls(coords);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast({
          title: "Location access denied",
          description: "Please allow location access or enter address manually.",
          variant: "destructive",
        });
        setIsGettingLocation(false);
      }
    );
  };

  const reverseGeocodeMappls = async (coords: [number, number]) => {
    try {
      const response = await fetch(
        `https://apis.mappls.com/advancedmaps/v1/71b7d04978f4e17d22a1e37e1c72535e/rev_geocode?lat=${coords[1]}&lng=${coords[0]}`
      );
      const data = await response.json();
      
      if (data && data.results && data.results.length > 0) {
        const result = data.results[0];
        const addressString = result.formatted_address || `${result.locality}, ${result.district}, ${result.state}`;
        
        setEditForm(prev => ({
          ...prev,
          address: addressString
        }));
        
        toast({
          title: "Location detected",
          description: "Address has been automatically filled from your current location.",
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      toast({
        title: "Location detected",
        description: "Please complete your address details manually.",
      });
    }
  };

  const handleLocationSelect = (coords: [number, number], addressString?: string) => {
    setCoordinates(coords);
    
    if (addressString) {
      setEditForm(prev => ({
        ...prev,
        address: addressString
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'confirmed': return 'text-blue-600';
      case 'preparing': return 'text-orange-600';
      case 'out-for-delivery': return 'text-purple-600';
      case 'delivered': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Profile not found</p>
            <Link to="/">
              <Button className="mt-4">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and order history</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editingProfile) {
                      setEditForm({
                        name: profile.name || '',
                        phone: profile.phone || '',
                        address: profile.address || ''
                      });
                    }
                    setEditingProfile(!editingProfile);
                  }}
                >
                  {editingProfile ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  {editingProfile ? 'Cancel' : 'Edit'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{profile.role || 'Customer'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    {editingProfile ? (
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 mt-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{profile.name || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    {editingProfile ? (
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 mt-1">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{profile.phone || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {editingProfile && (
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button onClick={updateProfile}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Delivery Address</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editingAddress) {
                      setEditForm(prev => ({
                        ...prev,
                        address: profile.address || ''
                      }));
                    }
                    setEditingAddress(!editingAddress);
                  }}
                >
                  {editingAddress ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  {editingAddress ? 'Cancel' : 'Edit'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingAddress ? (
                  <>
                    <div className="flex space-x-2 mb-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="flex-1"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
                      </Button>
                    </div>

                    <div className="mb-6">
                      <Label className="text-sm font-medium mb-2 block">Select address on map (optional)</Label>
                      <MappLsMap 
                        onLocationSelect={handleLocationSelect}
                        initialCoordinates={coordinates || undefined}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        placeholder="Enter your complete address"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button onClick={updateAddress}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Address
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profile.address || 'No address provided'}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Order History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No orders yet</p>
                    <Link to="/">
                      <Button>Start Shopping</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                                {order.status.toUpperCase().replace('-', ' ')}
                              </p>
                              <p className="font-semibold">${order.total_amount.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          {order.delivery_address && (
                            <p className="text-sm text-muted-foreground mb-3">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {order.delivery_address}
                            </p>
                          )}
                          
                          <div className="space-y-2">
                            {order.order_items.map((item, index) => (
                              <div key={index} className="flex items-center space-x-3">
                                {item.products.image && (
                                  <img
                                    src={item.products.image}
                                    alt={item.products.name}
                                    className="w-8 h-8 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{item.products.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;