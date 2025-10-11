import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import type { AdminUser } from './types';

interface UsersPageProps {
  users: AdminUser[];
  onRefresh: () => Promise<void>;
}

const UsersPage = ({ users, onRefresh }: UsersPageProps) => {
  const { toast } = useToast();

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: `User ${status === 'blocked' ? 'blocked' : 'activated'} successfully.`,
      });
      await onRefresh();
    } catch (err) {
      console.error('Error updating user status:', err);
      const message = err instanceof Error ? err.message : 'Failed to update user status.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground">Registered users will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold">{user.name || 'No Name'}</h3>
                  <Badge
                    variant={user.role === 'admin' ? 'default' : user.role === 'delivery' ? 'secondary' : 'outline'}
                    className="capitalize"
                  >
                    {user.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Email: {user.email}</p>
                {user.phone && (
                  <p className="text-sm text-muted-foreground mb-1">Phone: {user.phone}</p>
                )}
                {user.address && (
                  <p className="text-sm text-muted-foreground mb-1">Address: {user.address}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Badge variant={user.status === 'blocked' ? 'destructive' : 'default'} className="capitalize">
                  {user.status || 'active'}
                </Badge>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              {user.status !== 'blocked' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm(
                        `Are you sure you want to block ${user.name || user.email}? They won't be able to login.`
                      )
                    ) {
                      void handleUpdateUserStatus(user.id, 'blocked');
                    }
                  }}
                >
                  Block User
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Are you sure you want to activate ${user.name || user.email}?`)) {
                      void handleUpdateUserStatus(user.id, 'active');
                    }
                  }}
                >
                  Activate User
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UsersPage;
