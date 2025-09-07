import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

// Sample product data
const productData: Record<string, Product[]> = {
  grocery: [
    { id: 'g1', name: 'Whole Wheat Bread', price: 3.99, category: 'grocery', image: '/placeholder.svg' },
    { id: 'g2', name: 'Organic Milk (1L)', price: 4.49, category: 'grocery', image: '/placeholder.svg' },
    { id: 'g3', name: 'Brown Rice (2kg)', price: 8.99, category: 'grocery', image: '/placeholder.svg' },
    { id: 'g4', name: 'Olive Oil (500ml)', price: 12.99, category: 'grocery', image: '/placeholder.svg' },
    { id: 'g5', name: 'Pasta (500g)', price: 2.99, category: 'grocery', image: '/placeholder.svg' },
    { id: 'g6', name: 'Canned Tomatoes', price: 1.89, category: 'grocery', image: '/placeholder.svg' }
  ],
  vegetables: [
    { id: 'v1', name: 'Fresh Tomatoes (1kg)', price: 4.99, category: 'vegetables', image: '/placeholder.svg' },
    { id: 'v2', name: 'Organic Carrots (500g)', price: 3.49, category: 'vegetables', image: '/placeholder.svg' },
    { id: 'v3', name: 'Fresh Spinach (250g)', price: 2.99, category: 'vegetables', image: '/placeholder.svg' },
    { id: 'v4', name: 'Bell Peppers (3pcs)', price: 5.99, category: 'vegetables', image: '/placeholder.svg' },
    { id: 'v5', name: 'Red Onions (1kg)', price: 2.49, category: 'vegetables', image: '/placeholder.svg' },
    { id: 'v6', name: 'Fresh Broccoli', price: 3.99, category: 'vegetables', image: '/placeholder.svg' }
  ],
  fruits: [
    { id: 'f1', name: 'Red Apples (1kg)', price: 5.99, category: 'fruits', image: '/placeholder.svg' },
    { id: 'f2', name: 'Fresh Bananas (1kg)', price: 3.49, category: 'fruits', image: '/placeholder.svg' },
    { id: 'f3', name: 'Orange Pack (2kg)', price: 7.99, category: 'fruits', image: '/placeholder.svg' },
    { id: 'f4', name: 'Fresh Grapes (500g)', price: 6.99, category: 'fruits', image: '/placeholder.svg' },
    { id: 'f5', name: 'Strawberries (250g)', price: 4.99, category: 'fruits', image: '/placeholder.svg' },
    { id: 'f6', name: 'Mango (3pcs)', price: 8.99, category: 'fruits', image: '/placeholder.svg' }
  ],
  'cold-drinks': [
    { id: 'd1', name: 'Coca Cola (2L)', price: 3.99, category: 'cold-drinks', image: '/placeholder.svg' },
    { id: 'd2', name: 'Orange Juice (1L)', price: 4.99, category: 'cold-drinks', image: '/placeholder.svg' },
    { id: 'd3', name: 'Sparkling Water (6pack)', price: 5.49, category: 'cold-drinks', image: '/placeholder.svg' },
    { id: 'd4', name: 'Energy Drink (250ml)', price: 2.99, category: 'cold-drinks', image: '/placeholder.svg' },
    { id: 'd5', name: 'Iced Tea (500ml)', price: 2.49, category: 'cold-drinks', image: '/placeholder.svg' },
    { id: 'd6', name: 'Lemonade (1L)', price: 3.49, category: 'cold-drinks', image: '/placeholder.svg' }
  ]
};

const categoryNames: Record<string, string> = {
  grocery: 'Grocery',
  vegetables: 'Vegetables',
  fruits: 'Fruits',
  'cold-drinks': 'Cold Drinks'
};

const Category = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { addToCart } = useCart();
  const { toast } = useToast();

  if (!categoryId || !productData[categoryId]) {
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

  const products = productData[categoryId];
  const categoryName = categoryNames[categoryId];

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
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
              <p className="text-muted-foreground">Fresh products delivered to your door</p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
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
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button 
                  onClick={() => handleAddToCart(product)}
                  className="w-full hover:bg-primary/90 transition-colors"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">No products found</h2>
            <p className="text-muted-foreground">We're working on adding more products to this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;