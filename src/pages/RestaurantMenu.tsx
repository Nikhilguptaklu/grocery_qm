import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, MapPin, Phone, UtensilsCrossed } from 'lucide-react';
import { useCart, type Product as CartProduct } from '@/contexts/CartContext';
import type { Restaurant, RestaurantFood } from '@/pages/Admin/types';

const FALLBACK_IMAGE = 'https://via.placeholder.com/300x200?text=Food';

const RestaurantMenu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, updateQuantity, cartItems, removeFromCart } = useCart();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [foods, setFoods] = useState<RestaurantFood[]>([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      navigate('/restaurants');
      return;
    }
    void fetchRestaurantData(restaurantId);
  }, [restaurantId, navigate]);

  const fetchRestaurantData = async (id: string) => {
    setLoading(true);
    try {
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (restaurantError) {
        throw restaurantError;
      }

      if (!restaurantData || !(restaurantData as Restaurant).is_active) {
        toast({
          title: 'Unavailable',
          description: 'This restaurant is not currently available.',
          variant: 'destructive',
        });
        navigate('/restaurants');
        return;
      }

      setRestaurant(restaurantData as Restaurant);

      const { data: foodsData, error: foodsError } = await supabase
        .from('restaurant_foods')
        .select('*')
        .eq('restaurant_id', id)
        .eq('is_available', true)
        .order('name', { ascending: true });

      if (foodsError) {
        throw foodsError;
      }

      setFoods((foodsData as RestaurantFood[]) || []);
    } catch (err) {
      console.error('Error loading restaurant menu:', err);
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to load restaurant menu. Please try again.',
        variant: 'destructive',
      });
      navigate('/restaurants');
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = useMemo(() => {
    const term = foodSearch.trim().toLowerCase();
    if (!term) {
      return foods;
    }
    return foods.filter((food) => {
      const name = food.name?.toLowerCase() ?? '';
      const description = food.description?.toLowerCase() ?? '';
      return name.includes(term) || description.includes(term);
    });
  }, [foods, foodSearch]);

  const getCartId = (food: RestaurantFood) => `restaurant-food:${food.id}`;

  const getCartItemQuantity = (food: RestaurantFood) => {
    const cartItem = cartItems.find((item) => item.id === getCartId(food));
    return cartItem?.quantity ?? 0;
  };

  const buildCartProduct = (food: RestaurantFood): CartProduct => ({
    id: getCartId(food),
    name: food.name,
    price: food.price,
    category: restaurant ? `Restaurant • ${restaurant.name}` : 'Restaurant',
    image: food.image_url || restaurant?.image_url || FALLBACK_IMAGE,
    unit: 'portion',
    type: 'restaurant',
    restaurantId: restaurant?.id,
    restaurantName: restaurant?.name,
    restaurantFoodId: food.id,
  });

  const handleAddToCart = (food: RestaurantFood) => {
    addToCart(buildCartProduct(food));
    toast({
      title: 'Added to cart',
      description: `${food.name} added to your cart.`,
    });
  };

  const handleIncrement = (food: RestaurantFood) => {
    const currentQuantity = getCartItemQuantity(food);
    updateQuantity(getCartId(food), currentQuantity + 1);
  };

  const handleDecrement = (food: RestaurantFood) => {
    const currentQuantity = getCartItemQuantity(food);
    if (currentQuantity <= 1) {
      removeFromCart(getCartId(food));
      toast({
        title: 'Removed from cart',
        description: `${food.name} removed from your cart.`,
      });
      return;
    }
    updateQuantity(getCartId(food), currentQuantity - 1);
  };

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  const restaurantItemCount = useMemo(() => {
    if (!restaurant?.id) {
      return 0;
    }
    return cartItems
      .filter((item) => item.type === 'restaurant' && item.restaurantId === restaurant.id)
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems, restaurant?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{restaurant.name} | HN Mart Restaurants</title>
        <meta
          name="description"
          content={`Explore the ${restaurant.name} menu and add dishes to your HN Mart cart.`}
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 space-y-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/restaurants')} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to restaurants
          </Button>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <UtensilsCrossed className="w-4 h-4 mr-2" />
            Restaurant Menu
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{restaurant.name}</h1>
          {restaurant.description && (
            <p className="text-muted-foreground max-w-2xl">{restaurant.description}</p>
          )}
        </div>

        <Card>
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              {restaurant.address && (
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {restaurant.address}
                </p>
              )}
              {restaurant.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {restaurant.phone}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="self-start md:self-center">
              Open for orders
            </Badge>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Available Dishes</h2>
              <p className="text-sm text-muted-foreground">
                {filteredFoods.length} {filteredFoods.length === 1 ? 'item' : 'items'} available
              </p>
            </div>
            <div className="w-full sm:max-w-xs">
              <Label htmlFor="food-search" className="sr-only">
                Search dishes
              </Label>
              <Input
                id="food-search"
                placeholder="Search dishes..."
                value={foodSearch}
                onChange={(event) => setFoodSearch(event.target.value)}
              />
            </div>
          </div>

          {filteredFoods.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>
                  {foods.length === 0
                    ? 'No dishes available for this restaurant at the moment.'
                    : 'No dishes match your search.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredFoods.map((item) => {
                const quantityInCart = getCartItemQuantity(item);
                return (
                  <Card key={item.id} className="h-full">
                    <CardContent className="p-4 flex flex-col gap-4 h-full">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-40 object-cover rounded-md"
                          onError={(event) => {
                            const target = event.target as HTMLImageElement;
                            target.src = FALLBACK_IMAGE;
                          }}
                        />
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <span className="text-primary font-semibold">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">Available</Badge>
                        {quantityInCart > 0 ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDecrement(item)}
                            >
                              -
                            </Button>
                            <span className="font-medium w-6 text-center">{quantityInCart}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleIncrement(item)}
                            >
                              +
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={() => handleAddToCart(item)}>Add to cart</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {restaurant && restaurantItemCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 px-4">
          <Link to="/cart">
            <Button className="w-full shadow-lg">
              View Cart ({restaurantItemCount})
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default RestaurantMenu;





