import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Plus, Trash2 } from 'lucide-react';
import type { DeliverySettings } from './types';

interface DeliveryPageProps {
  deliverySettings: DeliverySettings[];
  onRefresh: () => Promise<void>;
}

const emptyDeliveryForm = {
  free_delivery_threshold: '',
  delivery_fee: '',
  is_active: true,
};

const DeliveryPage = ({ deliverySettings, onRefresh }: DeliveryPageProps) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ ...emptyDeliveryForm });

  const resetForm = () => {
    setFormState({ ...emptyDeliveryForm });
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formState.free_delivery_threshold || !formState.delivery_fee) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        free_delivery_threshold: parseFloat(formState.free_delivery_threshold),
        delivery_fee: parseFloat(formState.delivery_fee),
        is_active: formState.is_active,
      };

      if (editingId) {
        const { error } = await supabase.from('delivery_settings').update(payload).eq('id', editingId);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('delivery_settings').insert([payload]);
        if (error) {
          throw error;
        }
      }

      toast({
        title: 'Success',
        description: `Delivery settings ${editingId ? 'updated' : 'created'} successfully.`,
      });

      resetForm();
      setShowDialog(false);
      await onRefresh();
    } catch (err) {
      console.error('Error saving delivery settings:', err);
      const message = err instanceof Error ? err.message : 'Failed to save delivery settings.';
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
    if (!confirm('Are you sure you want to delete this delivery setting?')) {
      return;
    }

    try {
      const { error } = await supabase.from('delivery_settings').delete().eq('id', id);
      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Delivery setting deleted successfully.',
      });

      await onRefresh();
    } catch (err) {
      console.error('Error deleting delivery setting:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete delivery setting.';
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

  const openEditDialog = (setting: DeliverySettings) => {
    setFormState({
      free_delivery_threshold: setting.free_delivery_threshold.toString(),
      delivery_fee: setting.delivery_fee.toString(),
      is_active: setting.is_active,
    });
    setEditingId(setting.id);
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

  const formatAmount = (amount: number) => `\u20B9${amount.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Delivery Fee Management</h2>
        <Dialog open={showDialog} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Delivery Setting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Delivery Setting' : 'Add New Delivery Setting'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="free_delivery_threshold">Free Delivery Threshold (\u20B9) *</Label>
                <Input
                  id="free_delivery_threshold"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formState.free_delivery_threshold}
                  onChange={(event) =>
                    setFormState({ ...formState, free_delivery_threshold: event.target.value })
                  }
                  required
                  placeholder="500.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Orders above this amount get free delivery
                </p>
              </div>
              <div>
                <Label htmlFor="delivery_fee">Delivery Fee (\u20B9) *</Label>
                <Input
                  id="delivery_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formState.delivery_fee}
                  onChange={(event) => setFormState({ ...formState, delivery_fee: event.target.value })}
                  required
                  placeholder="50.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Standard delivery fee for orders below threshold
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formState.is_active}
                  onCheckedChange={(checked) => setFormState({ ...formState, is_active: Boolean(checked) })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingId ? 'Update Setting' : 'Add Setting'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {deliverySettings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No delivery settings found. Add your first delivery fee configuration.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Delivery Setting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliverySettings.map((setting) => (
            <Card key={setting.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Delivery Setting</h3>
                    <Badge variant={setting.is_active ? 'default' : 'secondary'}>
                      {setting.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span>Free Delivery Threshold:</span>
                    <span className="font-medium">{formatAmount(setting.free_delivery_threshold)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span className="font-medium">{formatAmount(setting.delivery_fee)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Orders above {formatAmount(setting.free_delivery_threshold)} get free delivery, otherwise{' '}
                    {formatAmount(setting.delivery_fee)} delivery fee applies.
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(setting)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(setting.id)}>
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

export default DeliveryPage;
