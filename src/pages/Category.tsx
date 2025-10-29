import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
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
  const categoryTitle = categoryNames[categoryId || 'all'] || 'Category';
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
          const prods = (data || []) as any[];

          // fetch keywords for all product ids in one go
          try {
            const ids = prods.map(p => p.id).filter(Boolean);
            if (ids.length > 0) {
              const { data: kws } = await supabase.from('product_keywords').select('product_id, keyword').in('product_id', ids);
              const kwMap: Record<string, string[]> = {};
              if (Array.isArray(kws)) {
                for (const row of kws) {
                  if (!kwMap[row.product_id]) kwMap[row.product_id] = [];
                  kwMap[row.product_id].push(row.keyword);
                }
              }
              // attach keywords to products
              for (const p of prods) {
                p.keywords = kwMap[p.id] || [];
              }
            }
          } catch (e) {
            // ignore keyword fetch errors
          }

          setProducts(prods || []);
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

  // Prepare a JSON-LD safe products array (some DB fields like description/stock may be missing from Product type)
  const ldProducts = products.map(p => {
    const image = p.image
      ? (p.image.startsWith && (p.image as string).startsWith('http') ? p.image : `https://hnmart.in${(p.image as string).startsWith('/') ? p.image : '/' + p.image}`)
      : 'https://hnmart.in/favicon.ico';

    const anyP = p as any;
    return {
      name: p.name || '',
      image,
      description: anyP.description || '',
      sku: p.id || '',
      offers: {
        price: (typeof p.price === 'number' ? (p.price as number).toFixed(2) : String(p.price || '0')),
        priceCurrency: 'INR',
        availability: anyP.stock && anyP.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      }
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${categoryTitle} | HN Mart`}</title>
  <link rel="canonical" href={`https://hnmart.in/category/${categoryId}`} />
        <meta name="description" content={`Shop ${categoryTitle} at HN Mart. Fresh groceries, best prices, fast delivery.`} />
        <meta name="keywords" content={`hnmart, ${categoryTitle.toLowerCase()}, grocery, online shopping, delivery`} />
        <meta property="og:title" content={`${categoryTitle} | HN Mart`} />
        <meta property="og:description" content={`Shop ${categoryTitle} at HN Mart. Fresh groceries, best prices, fast delivery.`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/favicon.ico" />
  <meta property="og:url" content={`https://hnmart.in/category/${categoryId}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": ldProducts.map((p, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "item": {
                "@type": "Product",
                "name": p.name,
                "image": p.image,
                "sku": p.sku,
                "offers": p.offers
              }
            }))
          }, null, 2)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": ldProducts.map(p => ({
              "@type": "Product",
              "name": p.name,
              "image": p.image,
              "description": p.description,
              "sku": p.sku,
              "offers": {
                "@type": "Offer",
                "price": p.offers.price,
                "priceCurrency": p.offers.priceCurrency,
                "availability": p.offers.availability
              }
            }))
          }, null, 2)}
        </script>
      </Helmet>
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

        {/* Search Bar */}
        <div className="mb-6 flex justify-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="h-32 sm:h-40 md:h-48 bg-muted rounded-t-lg" />
                <CardContent className="p-2 sm:p-4">
                  <div className="h-3 sm:h-4 bg-muted rounded mb-2" />
                  <div className="h-4 sm:h-6 bg-muted rounded w-16 sm:w-20" />
                </CardContent>
                <CardFooter className="p-2 sm:p-4 pt-0">
                  <div className="h-6 sm:h-8 bg-muted rounded w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {products.filter(product => {
              const term = search.trim().toLowerCase();
              if (!term) return true;
              const name = (product.name || '').toLowerCase();
              const desc = ((product as any).description || '').toLowerCase();
              const kws = Array.isArray((product as any).keywords) ? (product as any).keywords.map((k: string) => k.toLowerCase()) : [];
              return name.includes(term) || desc.includes(term) || kws.some((k: string) => k.includes(term));
            }).map((product, index) => (
              <Card 
                key={product.id} 
                className="flex flex-col justify-between hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1 animate-fade-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="p-0 flex-0">
                  <div className="relative overflow-hidden rounded-t-lg aspect-square">
                    <Link to={`/product/${product.id}`} className="absolute inset-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 absolute inset-0"
                        style={{ aspectRatio: '1/1' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-2 sm:p-3 flex-1 flex flex-col justify-center items-center">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-foreground mb-1 line-clamp-2 text-center">
                    <Link to={`/product/${product.id}`}>{product.name}</Link>
                  </CardTitle>
                  {product.description && (
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-2 text-center">{product.description}</p>
                  )}
                  {product.unit && (
                    <span className="text-xs text-muted-foreground mb-1">
                      {product.unit}
                    </span>
                  )}
                  { /* show brand if present */ }
                  {(product as any).brand && (
                    <span className="text-xs text-muted-foreground mb-1 ml-2">{(product as any).brand}</span>
                  )}
                  <span className="text-sm sm:text-base font-bold text-primary">
                    {`₹${Number(product.price).toFixed(2)}`}
                    {product.unit && <span className="text-xs text-muted-foreground ml-1">/ {product.unit}</span>}
                  </span>
                </CardContent>
                <CardFooter className="p-2 sm:p-3 pt-0 flex-0">
                  {getQuantityInCart(product.id) === 0 ? (
                    <Button 
                      onClick={() => handleAddToCart(product)}
                      className="w-full hover:bg-primary/90 transition-colors text-xs sm:text-sm"
                      size="sm"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Add to Cart</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  ) : (
                    <div className="w-full flex items-center justify-between gap-1 sm:gap-2">
                      <Button variant="outline" size="sm" onClick={() => decrement(product)} className="text-xs sm:text-sm px-2 sm:px-3">-</Button>
                      <div className="flex-1 text-center font-medium text-xs sm:text-sm">
                        Qty: {getQuantityInCart(product.id)}
                      </div>
                      <Button variant="default" size="sm" onClick={() => increment(product)} className="text-xs sm:text-sm px-2 sm:px-3">+</Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {products.filter(product => product.name.toLowerCase().includes(search.toLowerCase())).length === 0 && !loading && (
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
