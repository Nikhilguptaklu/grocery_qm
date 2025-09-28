import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const categoryNames: Record<string, string> = {
  grocery: 'Grocery',
  vegetables: 'Vegetables',
  fruits: 'Fruits',
  'cold-drinks': 'Cold Drinks',
  all: 'All Products' // ✅ added All Products
};

const Category = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!categoryId) return;
      
      setLoading(true);
      try {
        // ✅ If category is "all", fetch everything
        const { data, error } =
          categoryId === 'all'
            ? await supabase.from('products').select('*')
            : await supabase.from('products').select('*').eq('category', categoryId);

        if (error) {
          console.error('Error fetching products:', error);
          toast({
            title: "Error",
            description: "Failed to load products. Please try again.",
            variant: "destructive",
          });
        } else {
          setProducts(data || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, toast]);

  // ✅ Handle unknown category
  if (!categoryId || !categoryNames[categoryId]) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Category not found</h1>
          <Link to="/">
            <Button>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryName = categoryNames[categoryId];

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const getQuantityInCart = (productId: string) => {
    const item = cartItems.find(ci => ci.id === productId);
    return item ? item.quantity : 0;
  };

  const increment = (product: Product) => {
    const qty = getQuantityInCart(product.id);
    updateQuantity(product.id, qty + 1);
  };

  const decrement = (product: Product) => {
    const qty = getQuantityInCart(product.id);
    const next = qty - 1;
    if (next <= 0) {
      removeFromCart(product.id);
    } else {
      updateQuantity(product.id, next);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{categoryName}</h1>
              <p className="text-muted-foreground">
                {categoryId === 'all'
                  ? "Browse all available products"
                  : "Fresh products delivered to your door"}
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-6 bg-muted rounded w-20" />
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <div className="h-8 bg-muted rounded w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <Card 
                key={product.id} 
                className="hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1 animate-fade-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </CardHeader>
                
                <CardContent className="p-4">
                  <CardTitle className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                    {product.name}
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      {`₹${Number(product.price).toFixed(2)}`}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  {getQuantityInCart(product.id) === 0 ? (
                    <Button 
                      onClick={() => handleAddToCart(product)}
                      className="w-full hover:bg-primary/90 transition-colors"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  ) : (
                    <div className="w-full flex items-center justify-between gap-3">
                      <Button variant="outline" size="sm" onClick={() => decrement(product)}>-</Button>
                      <div className="flex-1 text-center font-medium">
                        Qty: {getQuantityInCart(product.id)}
                      </div>
                      <Button variant="default" size="sm" onClick={() => increment(product)}>+</Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {products.length === 0 && !loading && (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">No products found</h2>
            <p className="text-muted-foreground">
              {categoryId === 'all'
                ? "No products are available right now."
                : "We're working on adding more products to this category."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;
