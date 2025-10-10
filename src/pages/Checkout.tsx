import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
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
import type { Database } from '@/integrations/supabase/types';
import AddressPicker from '@/components/AddressPicker';

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
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    landmark: '',
    alternatePhone: ''
  });

  const [previousAddresses, setPreviousAddresses] = useState<any[]>([]);
  const [usePreviousAddress, setUsePreviousAddress] = useState(false);
  const [selectedPreviousAddress, setSelectedPreviousAddress] = useState<string>('');

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Delivery fee state
  const [deliverySettings, setDeliverySettings] = useState<any>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Redirect if user not logged in or cart empty
  useEffect(() => {
    if (authLoading) return;
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
  }, [user, authLoading, cartItems, navigate, toast]);

  // Fetch previous addresses and delivery settings
  useEffect(() => {
    const fetchPreviousAddresses = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('delivery_address, delivery_lat, delivery_lon, created_at')
          .eq('user_id', user.id)
          .not('delivery_address', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setPreviousAddresses(data || []);
      } catch (error) {
        console.error('Error fetching previous addresses:', error);
      }
    };

    const fetchDeliverySettings = async () => {
      try {
        console.log('Fetching delivery settings...');
        const { data, error } = await (supabase as any)
          .from('delivery_settings')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching delivery settings:', error);
        } else if (data) {
          console.log('Delivery settings fetched:', data);
          setDeliverySettings(data);
        } else {
          console.log('No delivery settings found');
        }
      } catch (error) {
        console.error('Error fetching delivery settings:', error);
      }
    };

    if (user) {
      fetchPreviousAddresses();
    }
    fetchDeliverySettings();
  }, [user]);

  // AddressPicker onSave handler
  const handlePickAddress = (data: { lat: number; lon: number; address: string }) => {
    setCoordinates([data.lon, data.lat]);
    setAddress(prev => ({
      ...prev,
      street: data.address,
    }));
    setCurrentStep(2);
  };

  // Handle previous address selection
  const handlePreviousAddressSelect = (addressData: any) => {
    setAddress(prev => ({
      ...prev,
      street: addressData.delivery_address,
    }));
    if (addressData.delivery_lat && addressData.delivery_lon) {
      setCoordinates([addressData.delivery_lon, addressData.delivery_lat]);
    }
    setUsePreviousAddress(false);
    setCurrentStep(2);
  };

  // Coupon validation function
  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError('');

    try {
      const { data: dataRaw, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      const data = dataRaw as Database['public']['Tables']['coupons']['Row'] | null;

      if (error || !data) {
        setCouponError('Invalid coupon code');
        return;
      }

      // Check if coupon is expired
      if (new Date(data.valid_until) < new Date()) {
        setCouponError('Coupon has expired');
        return;
      }

      // Check if coupon has reached usage limit
      if (data.usage_limit && data.used_count >= data.usage_limit) {
        setCouponError('Coupon usage limit reached');
        return;
      }

      // Check minimum order amount
      const cartTotal = getCartTotal();
      if (data.min_order_amount && cartTotal < data.min_order_amount) {
        setCouponError(`Minimum order amount of ₹${data.min_order_amount} required`);
        return;
      }

      setAppliedCoupon(data);
      toast({
        title: "Coupon Applied!",
        description: `${data.description || 'Discount applied successfully'}`,
      });
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Error validating coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Calculate discount amount
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    const cartTotal = getCartTotal();
    let discount = 0;

    if (appliedCoupon.discount_type === 'percentage') {
      discount = (cartTotal * appliedCoupon.discount_value) / 100;
    } else {
      discount = appliedCoupon.discount_value;
    }

    // Apply maximum discount limit if set
    if (appliedCoupon.max_discount_amount && discount > appliedCoupon.max_discount_amount) {
      discount = appliedCoupon.max_discount_amount;
    }

    return Math.min(discount, cartTotal); // Don't discount more than cart total
  };

  // Calculate delivery fee
  const calculateDeliveryFee = () => {
    if (!deliverySettings) {
      console.log('No delivery settings found, using default fee of ₹50');
      return 50; // Default delivery fee if no settings found
    }
    
    const cartTotal = getCartTotal();
    const discount = calculateDiscount();
    const finalAmount = cartTotal - discount;
    
    console.log('Delivery calculation:', {
      cartTotal,
      discount,
      finalAmount,
      threshold: deliverySettings.free_delivery_threshold,
      deliveryFee: deliverySettings.delivery_fee
    });
    
    // If order amount is above threshold, delivery is free
    if (finalAmount >= deliverySettings.free_delivery_threshold) {
      console.log('Free delivery applied');
      return 0;
    }
    
    // Otherwise, apply delivery fee
    console.log('Delivery fee applied:', deliverySettings.delivery_fee);
    return deliverySettings.delivery_fee;
  };

  // Update delivery fee when cart or settings change
  useEffect(() => {
    const fee = calculateDeliveryFee();
    setDeliveryFee(fee);
  }, [deliverySettings, cartItems, appliedCoupon]);

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

    // Validate phone number (10 digits)
    if (address.phone.length !== 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, Landmark: ${address.landmark}`;
      const cartTotal = getCartTotal();
      const discount = calculateDiscount();
      const deliveryFeeAmount = calculateDeliveryFee();
      const finalAmount = (cartTotal - discount + deliveryFeeAmount) * 1.1; // Apply tax after discount and delivery fee

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: finalAmount,
          status: 'confirmed',
          delivery_address: fullAddress,
          // store coords if available
          delivery_lat: coordinates ? coordinates[1] : null,
          delivery_lon: coordinates ? coordinates[0] : null,
          payment_method: paymentMethod,
          delivery_notes: `${deliveryNotes} | Alt Phone: ${address.alternatePhone}`,
          coupon_code: appliedCoupon?.code || null,
          discount_amount: discount,
          delivery_fee: deliveryFeeAmount
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

      // Update coupon usage count if coupon was applied
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ used_count: appliedCoupon.used_count + 1 } as Database['public']['Tables']['coupons']['Update'])
          .eq('id', appliedCoupon.id);
      }

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
      <Helmet>
        <title>Checkout - HN Mart</title>
        <meta name="description" content="Secure checkout for HN Mart. Review your order, choose delivery and payment options, and place your order quickly and securely." />
        <meta name="keywords" content="hnmart, checkout, grocery checkout, online grocery, place order" />
        <meta property="og:title" content="Checkout - HN Mart" />
        <meta property="og:description" content="Secure checkout for HN Mart. Review your order, choose delivery and payment options, and place your order quickly and securely." />
        <meta property="og:type" content="website" />
  <meta property="og:url" content="https://hnmart.in/checkout" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Checkout - HN Mart" />
        <meta name="twitter:description" content="Secure checkout for HN Mart. Review your order and place it quickly." />
        <script type="application/ld+json">
          {`{
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Checkout - HN Mart",
            "description": "Secure checkout for HN Mart.",
            "url": "https://hnmart.in/checkout"
          }`}
        </script>
      </Helmet>
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
            {/* Step 1: Choose Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Delivery Location</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">Drag the pin or search to set your delivery location. You can also use your current GPS location.</div>
                
                {/* Previous Address Option */}
                {previousAddresses.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="usePreviousAddress"
                        checked={usePreviousAddress}
                        onChange={(e) => setUsePreviousAddress(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="usePreviousAddress" className="text-sm font-medium">
                        Use my previous address
                      </label>
                    </div>
                    
                    {usePreviousAddress && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select previous address:</label>
                        <select
                          value={selectedPreviousAddress}
                          onChange={(e) => setSelectedPreviousAddress(e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Choose an address...</option>
                          {previousAddresses.map((addr, index) => (
                            <option key={index} value={index}>
                              {addr.delivery_address} (Used on {new Date(addr.created_at).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                        
                        {selectedPreviousAddress && (
                          <Button
                            type="button"
                            onClick={() => handlePreviousAddressSelect(previousAddresses[parseInt(selectedPreviousAddress)])}
                            className="w-full"
                            size="sm"
                          >
                            Use This Address
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {!usePreviousAddress && (
                  <AddressPicker onSave={handlePickAddress} />
                )}
              </CardContent>
            </Card>

            {/* Step 2: Address & Payment */}
            {currentStep === 2 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>Delivery Address</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input placeholder="Street" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                      <Input placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input placeholder="ZIP Code" value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })} />
                      <Input 
                        placeholder="Phone (10 digits)" 
                        value={address.phone} 
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          if (value.length <= 10) {
                            setAddress({ ...address, phone: value });
                          }
                        }}
                        maxLength={10}
                        pattern="[0-9]{10}"
                      />
                    </div>
                    <Input placeholder="Landmark (e.g. Near SBI Bank)" value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />
                    <Input 
                      placeholder="Alternate Phone Number (10 digits)" 
                      value={address.alternatePhone} 
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                        if (value.length <= 10) {
                          setAddress({ ...address, alternatePhone: value });
                        }
                      }}
                      maxLength={10}
                      pattern="[0-9]{10}"
                    />

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

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Coupon Code</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!appliedCoupon ? (
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={() => validateCoupon(couponCode)}
                            disabled={isValidatingCoupon || !couponCode.trim()}
                          >
                            {isValidatingCoupon ? 'Validating...' : 'Apply'}
                          </Button>
                        </div>
                        {couponError && (
                          <p className="text-sm text-red-500">{couponError}</p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-green-800">
                              Coupon Applied: {appliedCoupon.code}
                            </p>
                            <p className="text-sm text-green-600">
                              {appliedCoupon.description}
                            </p>
                            <p className="text-sm text-green-600">
                              Discount: {appliedCoupon.discount_type === 'percentage' 
                                ? `${appliedCoupon.discount_value}%` 
                                : `₹${appliedCoupon.discount_value}`
                              }
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeCoupon}
                            className="text-green-600 border-green-300 hover:bg-green-100"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
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
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{formatPrice(calculateDiscount())}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? "text-success" : ""}>
                    {deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}
                  </span>
                </div>
                {deliverySettings && deliveryFee > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Add ₹{deliverySettings.free_delivery_threshold - (getCartTotal() - calculateDiscount())} more for free delivery
                  </div>
                )}
                {!deliverySettings && (
                  <div className="text-xs text-muted-foreground">
                    Using default delivery fee
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatPrice((getCartTotal() - calculateDiscount() + deliveryFee) * 0.1)}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice((getCartTotal() - calculateDiscount() + deliveryFee) * 1.1)}</span>
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
