import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, Navigation } from 'lucide-react';
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

// ✅ Helper for INR formatting
const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
};

const Checkout = () => {
  const { cartItems, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState(false);

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    landmark: '',
    alternatePhone: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Redirect if user not logged in or cart empty
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

  // Get current location
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
        setIsGettingLocation(false);
      },
      () => {
        toast({
          title: "Location access denied",
          description: "Please allow location access or enter address manually.",
          variant: "destructive",
        });
        setIsGettingLocation(false);
      }
    );
  };

  // Place order
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
      const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, Landmark: ${address.landmark}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: getCartTotal() * 1.1,
          status: 'confirmed',
          delivery_address: fullAddress,
          payment_method: paymentMethod,
          delivery_notes: `${deliveryNotes} | Alt Phone: ${address.alternatePhone}`
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      navigate(`/order-success?orderId=${order.id}`);
      toast({
        title: "Order placed",
        description: "Your order has been successfully placed!",
      });
    } catch {
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center space-x-4 mb-8">
          <Link to="/cart">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Delivery Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <Button
                    type="button"
                    variant={useCurrentLocation ? "default" : "outline"}
                    onClick={() => { setUseCurrentLocation(true); setManualAddress(false); getCurrentLocation(); }}
                    disabled={isGettingLocation}
                    className="flex-1"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    {isGettingLocation ? 'Getting...' : 'Use Current Location'}
                  </Button>
                  <Button
                    type="button"
                    variant={manualAddress ? "default" : "outline"}
                    onClick={() => { setManualAddress(true); setUseCurrentLocation(false); }}
                    className="flex-1"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Manual Address
                  </Button>
                </div>

                {useCurrentLocation && (
                  <MappLsMap onLocationSelect={setCoordinates} initialCoordinates={coordinates || undefined} />
                )}

                <Input placeholder="Street" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  <Input placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input placeholder="ZIP Code" value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })} />
                  <Input placeholder="Phone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                </div>
                <Input placeholder="Landmark (e.g. Near SBI Bank)" value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />
                <Input placeholder="Alternate Phone Number" value={address.alternatePhone} onChange={(e) => setAddress({ ...address, alternatePhone: e.target.value })} />

                <Textarea placeholder="Delivery Notes (Optional)" value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} rows={3} />
              </CardContent>
            </Card>

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
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <hr />
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-success">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatPrice(getCartTotal() * 0.1)}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(getCartTotal() * 1.1)}</span>
                </div>
                <Button onClick={handlePlaceOrder} className="w-full mt-6" size="lg" disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Place Order'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
