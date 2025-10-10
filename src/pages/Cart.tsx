import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ✅ Helper function for INR formatting
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(price);
};

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(id);
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemoveItem = (id: string, name: string) => {
    removeFromCart(id);
    toast({
      title: "Item removed",
      description: `${name} has been removed from your cart.`,
    });
  };

  const handleClearCart = () => {
    clearCart();
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart.",
    });
  };

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to place an order.",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background px-4">
        <Helmet>
          <title>Cart | HN Mart</title>
          <meta name="description" content="View and manage your cart at HN Mart. Fast checkout, best prices, fresh groceries." />
          <meta name="keywords" content="hnmart, cart, grocery, checkout, online shopping, delivery" />
          <meta property="og:title" content="Cart | HN Mart" />
          <meta property="og:description" content="View and manage your cart at HN Mart. Fast checkout, best prices, fresh groceries." />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="/public/favicon.ico" />
          <meta property="og:url" content="https://hnmart.com/cart" />
        </Helmet>
        <div className="max-w-4xl mx-auto py-8">
          <div className="flex flex-col sm:flex-row items-center sm:space-x-4 mb-8 text-center sm:text-left">
            <Link to="/">
              <Button variant="outline" size="sm" className="mb-4 sm:mb-0">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Your Cart</h1>
          </div>

          <div className="text-center py-16">
            <ShoppingCart className="w-20 h-20 sm:w-24 sm:h-24 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">
              Looks like you haven't added any items yet.
            </p>
            <Link to="/">
              <Button size="lg">
                Start Shopping
                <ArrowLeft className="ml-2 w-5 h-5 rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4">
      <Helmet>
        <title>Cart | HN Mart</title>
        <meta name="description" content="View and manage your cart at HN Mart. Fast checkout, best prices, fresh groceries." />
        <meta name="keywords" content="hnmart, cart, grocery, checkout, online shopping, delivery" />
        <meta property="og:title" content="Cart | HN Mart" />
        <meta property="og:description" content="View and manage your cart at HN Mart. Fast checkout, best prices, fresh groceries." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/public/favicon.ico" />
        <meta property="og:url" content="https://hnmart.com/cart" />
      </Helmet>
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="mb-4 sm:mb-0">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Cart</h1>
              <p className="text-muted-foreground">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          {cartItems.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleClearCart}
              className="text-destructive hover:text-destructive w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <Card 
                key={item.id} 
                className="animate-fade-up w-full"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg mb-4 sm:mb-0"
                    />
                    
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                      <p className="text-muted-foreground capitalize">{item.category}</p>
                      <p className="text-xl font-bold text-primary mt-2">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    {/* Quantity + Remove */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 mt-4 sm:mt-0">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-10 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        className="text-destructive hover:text-destructive p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Item Subtotal */}
                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <span className="text-lg font-semibold">
                      Subtotal: {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-success">Free</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax (10%)</span>
                  <span>{formatPrice(getCartTotal() * 0.1)}</span>
                </div>
                
                <hr className="my-4" />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(getCartTotal() * 1.1)}</span>
                </div>

                <Button 
                  onClick={handleCheckout}
                  className="w-full mt-6" 
                  size="lg"
                  disabled={cartItems.length === 0}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Checkout
                </Button>

                <p className="text-sm text-muted-foreground text-center mt-4">
                  Free delivery on orders over ₹2,000
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
