import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Edit, Plus, Trash2 } from 'lucide-react';
import type { Coupon } from './types';

interface CouponsPageProps {
  coupons: Coupon[];
  onRefresh: () => Promise<void>;
}

type DiscountType = 'percentage' | 'fixed';

const emptyCouponForm = {
  code: '',
  description: '',
  discount_type: 'percentage' as DiscountType,
  discount_value: '',
  min_order_amount: '',
  max_discount_amount: '',
  usage_limit: '',
  valid_from: '',
  valid_until: '',
};

const CouponsPage = ({ coupons, onRefresh }: CouponsPageProps) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ ...emptyCouponForm });

  const resetForm = () => {
    setFormState({ ...emptyCouponForm });
    setEditingCouponId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formState.code.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Coupon code is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formState.discount_value || isNaN(parseFloat(formState.discount_value))) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a valid discount value.',
        variant: 'destructive',
      });
      return;
    }

    if (!formState.valid_until) {
      toast({
        title: 'Validation Error',
        description: 'Please select a valid end date.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        code: formState.code.trim().toUpperCase(),
        description: formState.description.trim(),
        discount_type: formState.discount_type,
        discount_value: parseFloat(formState.discount_value),
        min_order_amount: formState.min_order_amount ? parseFloat(formState.min_order_amount) : null,
        max_discount_amount: formState.max_discount_amount ? parseFloat(formState.max_discount_amount) : null,
        usage_limit: formState.usage_limit ? parseInt(formState.usage_limit, 10) : null,
        valid_from: formState.valid_from || new Date().toISOString(),
        valid_until: formState.valid_until,
        is_active: true,
        used_count: 0,
      } as Database['public']['Tables']['coupons']['Insert'];

      if (editingCouponId) {
        const { error } = await supabase
          .from('coupons')
          .update(payload as Database['public']['Tables']['coupons']['Update'])
          .eq('id', editingCouponId);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('coupons').insert([payload]);
        if (error) {
          throw error;
        }
      }

      toast({
        title: 'Success',
        description: `Coupon ${editingCouponId ? 'updated' : 'created'} successfully.`,
      });

      resetForm();
      setShowDialog(false);
      await onRefresh();
    } catch (err) {
      console.error('Error saving coupon:', err);
      const message = err instanceof Error ? err.message : 'Failed to save coupon.';
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
    if (!confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Coupon deleted successfully.',
      });

      await onRefresh();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete coupon.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !isActive } as Database['public']['Tables']['coupons']['Update'])
        .eq('id', id);
      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: `Coupon ${!isActive ? 'activated' : 'deactivated'} successfully.`,
      });
      await onRefresh();
    } catch (err) {
      console.error('Error updating coupon status:', err);
      const message = err instanceof Error ? err.message : 'Failed to update coupon status.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (coupon: Coupon) => {
    setFormState({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: coupon.min_order_amount?.toString() || '',
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      valid_from: coupon.valid_from,
      valid_until: coupon.valid_until,
    });
    setEditingCouponId(coupon.id);
    setShowDialog(true);
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setShowDialog(false);
      resetForm();
    } else {
      setShowDialog(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Coupon Management</h2>
        <Dialog open={showDialog} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCouponId ? 'Edit Coupon' : 'Add New Coupon'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    value={formState.code}
                    onChange={(event) =>
                      setFormState({ ...formState, code: event.target.value.toUpperCase() })
                    }
                    required
                    placeholder="SAVE20"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formState.description}
                    onChange={(event) => setFormState({ ...formState, description: event.target.value })}
                    placeholder="20% off on all items"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type *</Label>
                  <Select
                    value={formState.discount_type}
                    onValueChange={(value: DiscountType) =>
                      setFormState({ ...formState, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount_value">Discount Value *</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formState.discount_value}
                    onChange={(event) => setFormState({ ...formState, discount_value: event.target.value })}
                    required
                    placeholder={formState.discount_type === 'percentage' ? '20' : '50'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_order_amount">Minimum Order Amount</Label>
                  <Input
                    id="min_order_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formState.min_order_amount}
                    onChange={(event) =>
                      setFormState({ ...formState, min_order_amount: event.target.value })
                    }
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="max_discount_amount">Max Discount Amount</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formState.max_discount_amount}
                    onChange={(event) =>
                      setFormState({ ...formState, max_discount_amount: event.target.value })
                    }
                    placeholder="200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="usage_limit">Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    min="1"
                    value={formState.usage_limit}
                    onChange={(event) => setFormState({ ...formState, usage_limit: event.target.value })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="datetime-local"
                    value={formState.valid_from}
                    onChange={(event) => setFormState({ ...formState, valid_from: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Valid Until *</Label>
                  <Input
                    id="valid_until"
                    type="datetime-local"
                    value={formState.valid_until}
                    onChange={(event) => setFormState({ ...formState, valid_until: event.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingCouponId ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No coupons found</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first coupon to offer discounts to customers.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Coupon
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{coupon.code}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{coupon.description}</p>
                  </div>
                  <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                    {coupon.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="font-medium">
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : `\u20B9${coupon.discount_value}`}
                    </span>
                  </div>
                  {coupon.min_order_amount && (
                    <div className="flex justify-between">
                      <span>Min Order:</span>
                      <span>{`\u20B9${coupon.min_order_amount}`}</span>
                    </div>
                  )}
                  {coupon.max_discount_amount && (
                    <div className="flex justify-between">
                      <span>Max Discount:</span>
                      <span>{`\u20B9${coupon.max_discount_amount}`}</span>
                    </div>
                  )}
                  {coupon.usage_limit && (
                    <div className="flex justify-between">
                      <span>Usage:</span>
                      <span>{coupon.used_count}/{coupon.usage_limit}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Valid Until:</span>
                    <span>{new Date(coupon.valid_until).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(coupon)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggleStatus(coupon.id, coupon.is_active)}>
                    {coupon.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(coupon.id)}>
                    <Trash2 className="w-4 h-4" />
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

export default CouponsPage;
