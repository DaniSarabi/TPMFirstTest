import InputError from '@/components/input-error';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import * as React from 'react';
import { Ticket } from '../Columns';

interface DiscussionCardProps {
  ticket: Ticket;
}

// Helper function to get initials from a name
const getInitials = (name: string) => {
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.toUpperCase().slice(0, 2);
};

export function DiscussionCard({ ticket }: DiscussionCardProps) {
  // Filter for user-submitted comments
const comments = ticket.updates.filter(
        update => update.comment && !update.comment.startsWith('Ping:') && !update.comment.startsWith('System:')
    );  const { data, setData, post, processing, errors, reset } = useForm({
    comment: '',
  });

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO We will create this route later
    post(route('tickets.updates.store', ticket.id), {
      onSuccess: () => reset('comment'),
    });
  };

  return (
    <Card className="shadow-lg drop-shadow-lg">
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* List of comments */}
        <div className="max-h-96 space-y-4 overflow-y-auto pr-2">
            
          {comments.length > 0 ? (
            comments.map((update) => (
              <div key={update.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(update.user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-md bg-muted p-3 text-sm">
                  <p className="font-semibold">{update.user.name}</p>
                  <p className="whitespace-pre-wrap">{update.comment}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground">No comments yet.</p>
          )}
          {ticket.description && (
                        <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>{getInitials(ticket.creator.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 rounded-md bg-muted p-3 text-sm">
                                <p className="font-semibold">{ticket.creator.name}</p>
                                <p className="whitespace-pre-wrap font-medium text-foreground">{ticket.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">Initial problem description</p>
                            </div>
                        </div>
                    )}
        </div>
        {/* Form to add a new comment */}
        <form onSubmit={submitComment} className="space-y-2 border-t border-primary pt-4">
          <Textarea
            className="w-full border-primary shadow-sm transition focus:border-primary focus:ring-2 focus:ring-primary"
            placeholder="Add a comment..."
            value={data.comment}
            onChange={(e) => setData('comment', e.target.value)}
          />
          <InputError message={errors.comment} />
          <div className="flex justify-end">
            <Button size="sm" disabled={processing}>
              {processing ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
