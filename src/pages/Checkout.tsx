import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, CheckCircle, Truck, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MappLsMap from '@/components/MappLsMap';

const Checkout = () => {
  const { cartItems, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState(false);
  
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryNotes, setDeliveryNotes] = useState('');

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
        
        // Update map location if available
        if ((window as any).updateMapLocation) {
          (window as any).updateMapLocation(coords);
        }
        
        // Use Mappls reverse geocoding
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
        
        // Auto-fill address fields
        setAddress(prev => ({
          ...prev,
          street: result.house_number ? `${result.house_number} ${result.street || ''}` : (result.street || ''),
          city: result.locality || '',
          state: result.state || '',
          zipCode: result.pincode || ''
        }));
        
        setCoordinates(coords);
        
        toast({
          title: "Location selected",
          description: "Address has been automatically filled. Please verify the details.",
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setCoordinates(coords);
      toast({
        title: "Location selected",
        description: "Please complete your address details manually.",
      });
    }
  };

  const handleLocationSelect = (coords: [number, number], addressString?: string) => {
    setCoordinates(coords);
    
    if (addressString) {
      // Parse the address string and populate form fields
      // This is a basic implementation - you might want to improve this
      const parts = addressString.split(',');
      if (parts.length >= 3) {
        setAddress(prev => ({
          ...prev,
          street: parts[0]?.trim() || '',
          city: parts[1]?.trim() || '',
          state: parts[2]?.trim() || ''
        }));
      }
    }
  };

  useEffect(() => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to checkout.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
  }, [user, cartItems, navigate, toast]);

  const handlePlaceOrder = async () => {
    if (!user) return;

    if (!address.street || !address.city || !address.state || !address.zipCode || !address.phone) {
      toast({
        title: "Complete address required",
        description: "Please fill in all address fields.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: getCartTotal() * 1.1, // Including tax
          status: 'confirmed',
          delivery_address: fullAddress
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();
      navigate(`/order-success?orderId=${order.id}`);
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link to="/cart">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Delivery Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address Selection Method */}
                <div className="flex space-x-2 mb-4">
                  <Button
                    type="button"
                    variant={useCurrentLocation ? "default" : "outline"}
                    onClick={() => {
                      setUseCurrentLocation(true);
                      setManualAddress(false);
                      getCurrentLocation();
                    }}
                    disabled={isGettingLocation}
                    className="flex-1"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
                  </Button>
                  <Button
                    type="button"
                    variant={manualAddress ? "default" : "outline"}
                    onClick={() => {
                      setManualAddress(true);
                      setUseCurrentLocation(false);
                    }}
                    className="flex-1"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Manual Address
                  </Button>
                </div>

                {/* Map Component - only show if using current location */}
                {useCurrentLocation && (
                  <div className="mb-6">
                    <Label className="text-sm font-medium mb-2 block">Select delivery location on map</Label>
                    <MappLsMap 
                      onLocationSelect={handleLocationSelect}
                      initialCoordinates={coordinates || undefined}
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={address.zipCode}
                      onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Special instructions for delivery..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card">Credit/Debit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash">Cash on Delivery</Label>
                  </div>
                </RadioGroup>
                
                {paymentMethod === 'card' && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Card payment processing will be handled securely at delivery.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <hr />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="text-success">Free</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${(getCartTotal() * 0.1).toFixed(2)}</span>
                  </div>
                  
                  <hr />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${(getCartTotal() * 1.1).toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  onClick={handlePlaceOrder}
                  className="w-full mt-6" 
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Place Order'}
                </Button>

                <p className="text-sm text-muted-foreground text-center mt-4">
                  Estimated delivery: 30-45 minutes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;