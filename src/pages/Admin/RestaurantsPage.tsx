import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import type { Restaurant, RestaurantFood } from './types';

interface RestaurantsPageProps {
  restaurants: Restaurant[];
  foods: RestaurantFood[];
  onRefresh: () => Promise<void>;
}

const emptyRestaurantForm = {
  name: '',
  description: '',
  address: '',
  phone: '',
  image_url: '',
  is_active: true,
};

const emptyFoodForm = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  is_available: true,
};

const RestaurantsPage = ({ restaurants, foods, onRefresh }: RestaurantsPageProps) => {
  const { toast } = useToast();

  const [restaurantDialogOpen, setRestaurantDialogOpen] = useState(false);
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState({ ...emptyRestaurantForm });
  const [foodForm, setFoodForm] = useState({ ...emptyFoodForm });
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [currentRestaurantForFood, setCurrentRestaurantForFood] = useState<string | null>(null);
  const [isSavingRestaurant, setIsSavingRestaurant] = useState(false);
  const [isSavingFood, setIsSavingFood] = useState(false);

  const resetRestaurantForm = () => {
    setRestaurantForm({ ...emptyRestaurantForm });
    setEditingRestaurantId(null);
  };

  const resetFoodForm = () => {
    setFoodForm({ ...emptyFoodForm });
    setEditingFoodId(null);
    setCurrentRestaurantForFood(null);
  };

  const openCreateRestaurant = () => {
    resetRestaurantForm();
    setRestaurantDialogOpen(true);
  };

  const openEditRestaurant = (restaurant: Restaurant) => {
    setRestaurantForm({
      name: restaurant.name,
      description: restaurant.description ?? '',
      address: restaurant.address ?? '',
      phone: restaurant.phone ?? '',
      image_url: restaurant.image_url ?? '',
      is_active: Boolean(restaurant.is_active),
    });
    setEditingRestaurantId(restaurant.id);
    setRestaurantDialogOpen(true);
  };

  const openCreateFood = (restaurantId: string) => {
    resetFoodForm();
    setCurrentRestaurantForFood(restaurantId);
    setFoodDialogOpen(true);
  };

  const openEditFood = (food: RestaurantFood) => {
    setFoodForm({
      name: food.name,
      description: food.description ?? '',
      price: food.price.toString(),
      image_url: food.image_url ?? '',
      is_available: Boolean(food.is_available),
    });
    setEditingFoodId(food.id);
    setCurrentRestaurantForFood(food.restaurant_id);
    setFoodDialogOpen(true);
  };

  const handleRestaurantSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!restaurantForm.name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Restaurant name is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingRestaurant(true);

    try {
      const payload = {
        name: restaurantForm.name.trim(),
        description: restaurantForm.description.trim() || null,
        address: restaurantForm.address.trim() || null,
        phone: restaurantForm.phone.trim() || null,
        image_url: restaurantForm.image_url.trim() || null,
        is_active: Boolean(restaurantForm.is_active),
      };

      if (editingRestaurantId) {
        const { error } = await supabase
          .from('restaurants')
          .update(payload)
          .eq('id', editingRestaurantId);

        if (error) {
          throw error;
        }

        toast({
          title: 'Restaurant updated',
          description: 'The restaurant details have been updated successfully.',
        });
      } else {
        const { error } = await supabase.from('restaurants').insert([payload]);

        if (error) {
          throw error;
        }

        toast({
          title: 'Restaurant created',
          description: 'New restaurant has been added successfully.',
        });
      }

      resetRestaurantForm();
      setRestaurantDialogOpen(false);
      await onRefresh();
    } catch (err) {
      console.error('Error saving restaurant:', err);
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to save restaurant. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingRestaurant(false);
    }
  };

  const handleRestaurantDelete = async (restaurantId: string) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) {
      return;
    }

    try {
      const { error } = await supabase.from('restaurants').delete().eq('id', restaurantId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Restaurant deleted',
        description: 'The restaurant has been removed successfully.',
      });

      await onRefresh();
    } catch (err) {
      console.error('Error deleting restaurant:', err);
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to delete restaurant. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleFoodSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentRestaurantForFood) {
      toast({
        title: 'Validation error',
        description: 'Please select a restaurant before adding food items.',
        variant: 'destructive',
      });
      return;
    }

    if (!foodForm.name.trim() || !foodForm.price.trim()) {
      toast({
        title: 'Validation error',
        description: 'Food name and price are required.',
        variant: 'destructive',
      });
      return;
    }

    const parsedPrice = parseFloat(foodForm.price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      toast({
        title: 'Validation error',
        description: 'Please provide a valid price value.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingFood(true);

    try {
      const payload = {
        restaurant_id: currentRestaurantForFood,
        name: foodForm.name.trim(),
        description: foodForm.description.trim() || null,
        price: parsedPrice,
        image_url: foodForm.image_url.trim() || null,
        is_available: Boolean(foodForm.is_available),
      };

      if (editingFoodId) {
        const { error } = await supabase.from('restaurant_foods').update(payload).eq('id', editingFoodId);

        if (error) {
          throw error;
        }

        toast({
          title: 'Food item updated',
          description: 'The food item has been updated successfully.',
        });
      } else {
        const { error } = await supabase.from('restaurant_foods').insert([payload]);

        if (error) {
          throw error;
        }

        toast({
          title: 'Food item created',
          description: 'New food item has been added successfully.',
        });
      }

      resetFoodForm();
      setFoodDialogOpen(false);
      await onRefresh();
    } catch (err) {
      console.error('Error saving food item:', err);
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to save food item. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingFood(false);
    }
  };

  const handleFoodDelete = async (foodId: string) => {
    if (!confirm('Are you sure you want to delete this food item?')) {
      return;
    }

    try {
      const { error } = await supabase.from('restaurant_foods').delete().eq('id', foodId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Food item deleted',
        description: 'The food item has been removed successfully.',
      });

      await onRefresh();
    } catch (err) {
      console.error('Error deleting food item:', err);
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to delete food item. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
            Restaurant Management
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage partner restaurants and their available food items.
          </p>
        </div>
        <Dialog open={restaurantDialogOpen} onOpenChange={setRestaurantDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateRestaurant}>
              <Plus className="w-4 h-4 mr-2" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRestaurantId ? 'Edit Restaurant' : 'Add Restaurant'}</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleRestaurantSubmit}>
              <div className="space-y-2">
                <Label htmlFor="restaurant-name">Restaurant Name *</Label>
                <Input
                  id="restaurant-name"
                  value={restaurantForm.name}
                  onChange={(event) =>
                    setRestaurantForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                  placeholder="The Spice House"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restaurant-description">Description</Label>
                <Textarea
                  id="restaurant-description"
                  value={restaurantForm.description}
                  onChange={(event) =>
                    setRestaurantForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={3}
                  placeholder="Short summary about the cuisine and specialties."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restaurant-address">Address</Label>
                <Textarea
                  id="restaurant-address"
                  value={restaurantForm.address}
                  onChange={(event) =>
                    setRestaurantForm((prev) => ({ ...prev, address: event.target.value }))
                  }
                  rows={2}
                  placeholder="123 Market Street, City"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurant-phone">Contact Number</Label>
                  <Input
                    id="restaurant-phone"
                    value={restaurantForm.phone}
                    onChange={(event) =>
                      setRestaurantForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    placeholder="+91 12345 67890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurant-image">Image URL</Label>
                  <Input
                    id="restaurant-image"
                    value={restaurantForm.image_url}
                    onChange={(event) =>
                      setRestaurantForm((prev) => ({ ...prev, image_url: event.target.value }))
                    }
                    placeholder="https://example.com/restaurant.jpg"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restaurant-active"
                  checked={restaurantForm.is_active}
                  onCheckedChange={(checked) =>
                    setRestaurantForm((prev) => ({ ...prev, is_active: Boolean(checked) }))
                  }
                />
                <Label htmlFor="restaurant-active" className="text-sm">
                  Restaurant is active
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={isSavingRestaurant}>
                {isSavingRestaurant ? 'Saving...' : editingRestaurantId ? 'Update Restaurant' : 'Add Restaurant'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {restaurants.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No restaurants found. Start by adding your first partner restaurant.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {restaurants.map((restaurant) => {
            const restaurantFoods = foods.filter((food) => food.restaurant_id === restaurant.id);
            return (
              <Card key={restaurant.id} className="h-full">
                <CardContent className="p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">{restaurant.name}</h3>
                      {restaurant.description && (
                        <p className="text-sm text-muted-foreground mt-1">{restaurant.description}</p>
                      )}
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        {restaurant.address && <p>{restaurant.address}</p>}
                        {restaurant.phone && <p>Contact: {restaurant.phone}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={restaurant.is_active ? 'secondary' : 'outline'}>
                        {restaurant.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditRestaurant(restaurant)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRestaurantDelete(restaurant.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Food Items</h4>
                      <Button size="sm" onClick={() => openCreateFood(restaurant.id)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Food Item
                      </Button>
                    </div>

                    {restaurantFoods.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No food items yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {restaurantFoods.map((food) => (
                          <div
                            key={food.id}
                            className="rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                          >
                            <div>
                              <p className="font-medium">{food.name}</p>
                              {food.description && (
                                <p className="text-sm text-muted-foreground mt-1">{food.description}</p>
                              )}
                              <p className="text-sm font-semibold mt-2">₹{food.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={food.is_available ? 'default' : 'outline'}>
                                {food.is_available ? 'Available' : 'Unavailable'}
                              </Badge>
                              <Button size="sm" variant="outline" onClick={() => openEditFood(food)}>
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleFoodDelete(food.id)}>
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={foodDialogOpen} onOpenChange={setFoodDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFoodId ? 'Edit Food Item' : 'Add Food Item'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleFoodSubmit}>
            <div className="space-y-2">
              <Label htmlFor="food-name">Food Name *</Label>
              <Input
                id="food-name"
                value={foodForm.name}
                onChange={(event) => setFoodForm((prev) => ({ ...prev, name: event.target.value }))}
                required
                placeholder="Paneer Butter Masala"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="food-description">Description</Label>
              <Textarea
                id="food-description"
                value={foodForm.description}
                onChange={(event) =>
                  setFoodForm((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={3}
                placeholder="Rich and creamy curry made with paneer and aromatic spices."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="food-price">Price *</Label>
                <Input
                  id="food-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={foodForm.price}
                  onChange={(event) => setFoodForm((prev) => ({ ...prev, price: event.target.value }))}
                  required
                  placeholder="250"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="food-image">Image URL</Label>
                <Input
                  id="food-image"
                  value={foodForm.image_url}
                  onChange={(event) =>
                    setFoodForm((prev) => ({ ...prev, image_url: event.target.value }))
                  }
                  placeholder="https://example.com/dish.jpg"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="food-available"
                checked={foodForm.is_available}
                onCheckedChange={(checked) =>
                  setFoodForm((prev) => ({ ...prev, is_available: Boolean(checked) }))
                }
              />
              <Label htmlFor="food-available" className="text-sm">
                Item is currently available
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={isSavingFood}>
              {isSavingFood ? 'Saving...' : editingFoodId ? 'Update Item' : 'Add Item'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantsPage;
