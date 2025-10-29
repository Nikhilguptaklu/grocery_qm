import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ProductPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [localNames, setLocalNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();
        if (error) {
          console.error('Error fetching product:', error);
          toast({ title: 'Error', description: 'Failed to load product', variant: 'destructive' });
        } else {
          setProduct(data);
          // fetch local keywords
          try {
            const { data: kws } = await supabase.from('product_keywords').select('keyword').eq('product_id', productId);
            if (Array.isArray(kws)) setLocalNames(kws.map((k: any) => k.keyword));
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Failed to load product', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, toast]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

  const image = product.image && (product.image.startsWith('http') ? product.image : `https://hnmart.in${product.image.startsWith('/') ? product.image : '/' + product.image}`);

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name || '',
    "image": image || 'https://hnmart.in/favicon.ico',
    "description": product.description || '',
    "sku": product.id || '',
    "brand": product.brand || 'HN Mart',
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": (typeof product.price === 'number' ? product.price.toFixed(2) : String(product.price || '0')),
      "availability": product.stock && product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      "url": `https://hnmart.in/product/${product.id}`
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{product.name + ' | HN Mart'}</title>
        <link rel="canonical" href={`https://hnmart.in/product/${product.id}`} />
        <meta name="description" content={product.description || 'Buy this product at HN Mart.'} />
        <meta property="og:title" content={product.name + ' | HN Mart'} />
        <meta property="og:description" content={product.description || 'Buy this product at HN Mart.'} />
        <meta property="og:image" content={image || '/favicon.ico'} />
        <script type="application/ld+json">{JSON.stringify(productLd, null, 2)}</script>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white rounded shadow overflow-hidden">
              <img src={image || '/favicon.ico'} alt={product.name} className="w-full h-80 object-cover" />
            </div>
          </div>
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-primary">₹{Number(product.price).toFixed(2)}{product.unit && <span className="text-sm text-muted-foreground"> / {product.unit}</span>}</p>
                {product.brand && (
                  <p className="text-sm text-muted-foreground mt-1">Brand: {product.brand}</p>
                )}
                {localNames.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">Also known as: {localNames.join(', ')}</p>
                )}
                <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>
                <div className="mt-6">
                  <Link to={`/category/${product.category || 'all'}`}>
                    <Button variant="outline">Back to Category</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
