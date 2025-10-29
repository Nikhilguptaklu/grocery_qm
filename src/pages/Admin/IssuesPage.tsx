import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare } from 'lucide-react';
import type { Issue } from './types';

interface IssuesPageProps {
  issues: Issue[];
  onRefresh: () => Promise<void>;
}

const IssuesPage = ({ issues, onRefresh }: IssuesPageProps) => {
  const { toast } = useToast();

  const handleUpdateIssue = async (issueId: string, status: string, adminNotes?: string) => {
    try {
      const updatePayload: Record<string, unknown> = { status };
      if (adminNotes) {
        updatePayload.admin_notes = adminNotes;
      }
      if (status === 'resolved') {
        updatePayload.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase.from('issues').update(updatePayload).eq('id', issueId);
      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Issue updated successfully.',
      });
      await onRefresh();
    } catch (err) {
      console.error('Error updating issue:', err);
      const message = err instanceof Error ? err.message : 'Failed to update issue.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleAddNotes = (issue: Issue) => {
    const notes = prompt('Add admin notes:', issue.admin_notes || '');
    if (notes) {
      void handleUpdateIssue(issue.id, issue.status, notes);
    }
  };

  if (issues.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No issues reported</h3>
          <p className="text-muted-foreground">Customer support issues will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {issues.map((issue) => (
        <Card key={issue.id}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">{issue.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Customer: {issue.profiles?.name || 'Unknown'} ({issue.profiles?.email || 'No email'})
                </p>
                <p className="text-sm mt-2">{issue.description}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Created: {new Date(issue.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Badge
                  variant={
                    issue.status === 'resolved'
                      ? 'default'
                      : issue.status === 'in-progress'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="capitalize"
                >
                  {issue.status.replace('-', ' ')}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {issue.priority}
                </Badge>
              </div>
            </div>

            {issue.admin_notes && (
              <div className="mb-4 p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Admin Notes:</strong> {issue.admin_notes}
                </p>
              </div>
            )}

            <div className="flex space-x-2">
              <Select value={issue.status} onValueChange={(value) => handleUpdateIssue(issue.id, value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => handleAddNotes(issue)}>
                Add Notes
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default IssuesPage;
