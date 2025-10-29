import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit, Package, Plus, Trash2 } from 'lucide-react';
import type { Product } from './types';

interface ProductsPageProps {
  products: Product[];
  onRefresh: () => Promise<void>;
  currentUserId?: string;
}

const emptyProductForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  stock: '',
  image: '',
  unit: '',
  brand: '',
  keywords: '',
};

const ProductsPage = ({ products, onRefresh, currentUserId }: ProductsPageProps) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ ...emptyProductForm });

  const resetForm = () => {
    setFormState({ ...emptyProductForm });
    setEditingProductId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentUserId) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to manage products.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (!formState.name.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Product name is required.',
          variant: 'destructive',
        });
        return;
      }

      if (!formState.price || isNaN(parseFloat(formState.price)) || parseFloat(formState.price) <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid price.',
          variant: 'destructive',
        });
        return;
      }

      if (!formState.stock || isNaN(parseInt(formState.stock, 10)) || parseInt(formState.stock, 10) < 0) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid stock quantity.',
          variant: 'destructive',
        });
        return;
      }

      if (!formState.category) {
        toast({
          title: 'Validation Error',
          description: 'Please select a category.',
          variant: 'destructive',
        });
        return;
      }

      const payload = {
        name: formState.name.trim(),
        description: formState.description.trim(),
        price: parseFloat(formState.price),
        category: formState.category,
        stock: parseInt(formState.stock, 10),
        unit: formState.unit?.trim() || null,
        brand: formState.brand?.trim() || null,
        image: formState.image.trim() || null,
        created_by: currentUserId,
      };

      let error;
      // We'll capture the product id (new or existing) so we can save keywords
      let savedProductId = editingProductId;
      if (editingProductId) {
        const { error: updateError } = await supabase.from('products').update(payload).eq('id', editingProductId);
        error = updateError;
      } else {
        const { data: insertData, error: insertError } = await supabase.from('products').insert([payload]).select().single();
        error = insertError;
        if (!insertError && insertData) {
          savedProductId = insertData.id;
        }
      }

      // If product saved, handle keywords insert/delete
      if (!error && savedProductId) {
        try {
          // delete existing keywords for this product (safe on create where none exist)
          await supabase.from('product_keywords').delete().eq('product_id', savedProductId);

          const raw = formState.keywords || '';
          const keywords = raw.split(',').map(s => s.trim()).filter(Boolean);
          if (keywords.length > 0) {
            const rows = keywords.map(k => ({ product_id: savedProductId, keyword: k }));
            const { error: kwError } = await supabase.from('product_keywords').insert(rows);
            if (kwError) {
              console.warn('Failed saving product keywords:', kwError);
            }
          }
        } catch (kwErr) {
          console.warn('Error saving product keywords:', kwErr);
        }
      }

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: `Product ${editingProductId ? 'updated' : 'created'} successfully.`,
      });

      resetForm();
      setShowDialog(false);
      await onRefresh();
    } catch (err) {
      console.error('Error saving product:', err);
      const message = err instanceof Error ? err.message : 'Failed to save product.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Product deleted successfully.',
      });

      await onRefresh();
    } catch (err) {
      console.error('Error deleting product:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete product.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (product: Product) => {
    // Load associated keywords and populate form
    (async () => {
      try {
        const { data: kws } = await supabase.from('product_keywords').select('keyword').eq('product_id', product.id);
        const keywords = Array.isArray(kws) ? kws.map((k: any) => k.keyword).join(', ') : '';
        setFormState({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          category: product.category,
          stock: product.stock.toString(),
          image: product.image ?? '',
          unit: product.unit ?? '',
          brand: product.brand ?? '',
          keywords,
        });
      } catch (err) {
        setFormState({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          category: product.category,
          stock: product.stock.toString(),
          image: product.image ?? '',
          unit: product.unit ?? '',
          brand: product.brand ?? '',
          keywords: '',
        });
      }
      setEditingProductId(product.id);
      setShowDialog(true);
    })();
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setShowDialog(false);
      resetForm();
    } else {
      setShowDialog(true);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Products Management</h2>
        <Dialog open={showDialog} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProductId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formState.name}
                  onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                  required
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formState.description}
                  onChange={(event) => setFormState({ ...formState, description: event.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formState.price}
                  onChange={(event) => setFormState({ ...formState, price: event.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formState.category}
                  onValueChange={(value) => setFormState({ ...formState, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fruits">Fruits</SelectItem>
                    <SelectItem value="vegetables">Vegetables</SelectItem>
                    <SelectItem value="cold-drinks">Cold Drinks</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="meat">Meat</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formState.stock}
                  onChange={(event) => setFormState({ ...formState, stock: event.target.value })}
                  required
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  type="url"
                  value={formState.image}
                  onChange={(event) => setFormState({ ...formState, image: event.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label htmlFor="unit">Weight / Unit</Label>
                <Input
                  id="unit"
                  value={formState.unit}
                  onChange={(event) => setFormState({ ...formState, unit: event.target.value })}
                  placeholder="e.g. 500g, 1kg, 1L"
                />
              </div>

              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formState.brand}
                  onChange={(event) => setFormState({ ...formState, brand: event.target.value })}
                  placeholder="Brand name (optional)"
                />
              </div>
              <div>
                <Label htmlFor="keywords">Local names / Keywords</Label>
                <Input
                  id="keywords"
                  value={formState.keywords}
                  onChange={(event) => setFormState({ ...formState, keywords: event.target.value })}
                  placeholder="Comma-separated (e.g. chawal, bhaat)"
                />
                <p className="text-xs text-muted-foreground mt-1">Add local names or aliases separated by commas. These help search.</p>
              </div>
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingProductId ? 'Update Product' : 'Add Product'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">Start by adding your first product to the inventory.</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-md mb-4"
                    onError={(event) => {
                      const target = event.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold">{'\u20B9'}{product.price.toFixed(2)}</span>
                  <div className="flex gap-2">
                      <Badge variant="secondary">Stock: {product.stock}</Badge>
                      <Badge variant="outline" className="capitalize">{product.category}</Badge>
                      {product.unit && <Badge variant="outline">{product.unit}</Badge>}
                      {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
                      { /* keywords not joined in product query; leave display to product detail */ }
                    </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
