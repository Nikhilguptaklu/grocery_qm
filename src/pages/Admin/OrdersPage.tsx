import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, CreditCard, ShoppingBag } from 'lucide-react';
import type { AdminUser, Order } from './types';

interface OrdersPageProps {
  orders: Order[];
  deliveryUsers: AdminUser[];
  onRefresh: () => Promise<void>;
}

const OrdersPage = ({ orders, deliveryUsers, onRefresh }: OrdersPageProps) => {
  const { toast } = useToast();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedStatusByOrder, setSelectedStatusByOrder] = useState<Record<string, string>>({});
  const [selectedDeliveryByOrder, setSelectedDeliveryByOrder] = useState<Record<string, string | null>>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  useEffect(() => {
    const statusMap: Record<string, string> = {};
    const deliveryMap: Record<string, string | null> = {};
    orders.forEach((order) => {
      statusMap[order.id] = order.status;
      deliveryMap[order.id] = order.delivery_person_id ?? null;
    });
    setSelectedStatusByOrder(statusMap);
    setSelectedDeliveryByOrder(deliveryMap);
    setExpandedOrders(new Set());
  }, [orders]);

  const statusCounts = useMemo(() => {
    return orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
  }, [orders]);

  const assigneeCounts = useMemo(() => {
    return orders.reduce<Record<string, number>>((acc, order) => {
      if (order.delivery_person_id) {
        acc[order.delivery_person_id] = (acc[order.delivery_person_id] || 0) + 1;
      }
      return acc;
    }, {});
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const statusOk = statusFilter === 'all' || order.status === statusFilter;
      const assigneeOk = assigneeFilter === 'all' || order.delivery_person_id === assigneeFilter;
      return statusOk && assigneeOk;
    });
  }, [orders, statusFilter, assigneeFilter]);

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleSubmitOrderChanges = async (orderId: string) => {
    const targetOrder = orders.find((order) => order.id === orderId);
    if (!targetOrder) {
      toast({
        title: 'Error',
        description: 'Unable to find the selected order.',
        variant: 'destructive',
      });
      return;
    }

    const nextStatus = selectedStatusByOrder[orderId] ?? targetOrder.status;
    const nextDeliveryUser = selectedDeliveryByOrder[orderId] ?? targetOrder.delivery_person_id ?? null;

    try {
      const updatePayload: Record<string, unknown> = { status: nextStatus };
      if (nextDeliveryUser) {
        updatePayload.delivery_person_id = nextDeliveryUser;
        if (nextStatus === 'out-for-delivery') {
          updatePayload.estimated_delivery = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        }
      } else {
        updatePayload.delivery_person_id = null;
      }

      const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
      if (error) {
        throw error;
      }

      toast({ title: 'Saved', description: 'Order changes applied.' });
      await onRefresh();
    } catch (err) {
      console.error('Error saving order changes:', err);
      const message = err instanceof Error ? err.message : 'Failed to save changes';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Orders Management</h2>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({orders.length})</SelectItem>
              <SelectItem value="pending">Pending ({statusCounts['pending'] || 0})</SelectItem>
              <SelectItem value="confirmed">Confirmed ({statusCounts['confirmed'] || 0})</SelectItem>
              <SelectItem value="out-for-delivery">Out for Delivery ({statusCounts['out-for-delivery'] || 0})</SelectItem>
              <SelectItem value="delivered">Delivered ({statusCounts['delivered'] || 0})</SelectItem>
              <SelectItem value="cancelled">Cancelled ({statusCounts['cancelled'] || 0})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Assigned to</span>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {deliveryUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {(user.name || user.email) + (user.role === 'admin' ? ' (Admin)' : '')} ({assigneeCounts[user.id] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground">Orders will appear here once customers start placing them.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const deliveryValue = selectedDeliveryByOrder[order.id] ?? order.delivery_person_id ?? null;

            return (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleOrderExpansion(order.id)}
                          className="p-1 h-6 w-6"
                        >
                          {expandedOrders.has(order.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Customer: {order.profiles?.name || 'Unknown'} ({order.profiles?.email || 'No email'})
                      </p>
                      <p className="text-sm text-muted-foreground">Address: {order.delivery_address}</p>
                      <p className="text-sm text-muted-foreground">
                        Date: {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      {order.payment_method && (
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-blue-500" />
                          <p className="text-sm text-muted-foreground">
                            Payment: {order.payment_method === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
                          </p>
                        </div>
                      )}
                      {order.order_items && order.order_items.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Items: {order.order_items.length} product{order.order_items.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{`\u20B9${Number(order.total_amount).toFixed(2)}`}</p>
                      {order.payment_method && (
                        <div className="flex items-center justify-end space-x-1 mb-2">
                          <CreditCard className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-muted-foreground">
                            {order.payment_method === 'card' ? 'Card' : 'Cash'}
                          </span>
                        </div>
                      )}
                      <Badge
                        variant={
                          order.status === 'delivered'
                            ? 'default'
                            : order.status === 'out-for-delivery'
                            ? 'secondary'
                            : order.status === 'confirmed'
                            ? 'outline'
                            : 'destructive'
                        }
                        className="capitalize"
                      >
                        {order.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {expandedOrders.has(order.id) && order.order_items && order.order_items.length > 0 && (
                    <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-3">Order Items:</h4>
                      <div className="space-y-3">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0"
                          >
                            <div className="flex items-center space-x-3">
                              {item.product.image && (
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="w-12 h-12 object-cover rounded-md"
                                  onError={(event) => {
                                    const target = event.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <p className="font-medium">{item.product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity} x {`\u20B9${item.price.toFixed(2)}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{`\u20B9${(item.quantity * item.price).toFixed(2)}`}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <div className="flex gap-2">
                      <Select
                        value={selectedStatusByOrder[order.id] ?? order.status}
                        onValueChange={(value) =>
                          setSelectedStatusByOrder((prev) => ({ ...prev, [order.id]: value }))
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>

                      {deliveryUsers.length > 0 && (
                        <Select
                          value={(deliveryValue ?? undefined) as string | undefined}
                          onValueChange={(deliveryUserId) =>
                            setSelectedDeliveryByOrder((prev) => ({ ...prev, [order.id]: deliveryUserId }))
                          }
                        >
                          <SelectTrigger className="w-56">
                            <SelectValue placeholder="Assign delivery person" />
                          </SelectTrigger>
                          <SelectContent>
                            {deliveryUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {(user.name || user.email) + (user.role === 'admin' ? ' (Admin)' : '')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <Button size="sm" onClick={() => handleSubmitOrderChanges(order.id)}>
                      Submit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
