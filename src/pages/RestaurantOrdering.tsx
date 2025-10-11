import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, UtensilsCrossed } from 'lucide-react';
import type { Restaurant } from '@/pages/Admin/types';

const RestaurantOrdering = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name', { ascending: true });

      if (restaurantsError) {
        throw restaurantsError;
      }

      setRestaurants((data as Restaurant[]) || []);
    } catch (err) {
      console.error('Error loading restaurants:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to load restaurants. Please try again later.';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const activeRestaurants = useMemo(
    () => restaurants.filter((restaurant) => restaurant.is_active),
    [restaurants]
  );

  const filteredRestaurants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return activeRestaurants;
    }
    return activeRestaurants.filter((restaurant) => {
      const name = restaurant.name?.toLowerCase() ?? '';
      const description = restaurant.description?.toLowerCase() ?? '';
      const address = restaurant.address?.toLowerCase() ?? '';
      return name.includes(term) || description.includes(term) || address.includes(term);
    });
  }, [activeRestaurants, searchTerm]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Order from Restaurants | HN Mart</title>
        <meta
          name="description"
          content="Browse partner restaurants on HN Mart and discover freshly prepared meals available for delivery."
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <UtensilsCrossed className="w-4 h-4 mr-2" />
            Restaurant Ordering
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Choose a Restaurant to Start Your Order
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore curated local restaurants and head into their menus to select your favourite meals.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="Search restaurants by name, cuisine, or address..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {filteredRestaurants.length}{' '}
            {filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={fetchRestaurants}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : filteredRestaurants.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground space-y-2">
              <p>No restaurants match your search.</p>
              {activeRestaurants.length > 0 && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="cursor-pointer transition hover:shadow-lg"
                onClick={() => navigate(`/restaurants/${restaurant.id}`)}
              >
                <CardContent className="p-4 space-y-3 h-full">
                  {restaurant.image_url && (
                    <img
                      src={restaurant.image_url}
                      alt={restaurant.name}
                      className="w-full h-36 object-cover rounded-md"
                      onError={(event) => {
                        const target = event.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-semibold">{restaurant.name}</h2>
                      {restaurant.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                          {restaurant.description}
                        </p>
                      )}
                    </div>
                    <Badge>Open</Badge>
                  </div>
                  {restaurant.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="line-clamp-2">{restaurant.address}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantOrdering;
