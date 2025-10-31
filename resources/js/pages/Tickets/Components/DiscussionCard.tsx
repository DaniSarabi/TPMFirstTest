import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/user-avatar';
import { Ticket, TicketUpdate } from '@/types/ticket';
import { useForm } from '@inertiajs/react';
import { MessageCircle, Send } from 'lucide-react';
import * as React from 'react';

interface DiscussionCardProps {
  ticket: Ticket;
}

interface DiscussionItem extends TicketUpdate {
  is_initial?: boolean; // Make it optional
}

export function DiscussionCard({ ticket }: DiscussionCardProps) {
  const discussionItems: DiscussionItem[] = React.useMemo(() => {
    const items: DiscussionItem[] = [];

    const createdEvent = ticket.updates.find((update) => !update.old_status && update.new_status);
    if (createdEvent) {
      items.push(createdEvent);
    }

    if (ticket.description) {
      items.push({
        // We cast this synthetic object to fit the TicketUpdate shape for consistency
        id: `initial-${ticket.id}` as any,
        user: ticket.creator,
        comment: ticket.description,
        created_at: ticket.created_at,
        is_initial: true,
        action_taken: null,
        parts_used: null,
        old_status: null,
        new_status: null,
        action: null,
        loggable_id: null,
        loggable_type: null,
        loggable: null,
      });
    }

    ticket.updates.forEach((update) => {
      if (
        update.comment &&
        !update.comment.startsWith('Ping:') &&
        !update.comment.startsWith('System') &&
        !update.comment.startsWith('Sent a part request') &&
        !update.comment.startsWith('Attached') &&
        !update.comment.startsWith('Detached') &&
        update.id !== createdEvent?.id
      ) {
        items.push(update);
      }
    });

    return items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [ticket]);
  const { data, setData, post, processing, errors, reset } = useForm({
    comment: '',
  });

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('tickets.updates.store', ticket.id), {
      onSuccess: () => reset('comment'),
    });
  };

  const formatTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="shadow-lg drop-shadow-lg transition-transform ease-in-out hover:-translate-1 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:border-0 lg:shadow-none lg:drop-shadow-none">
      {' '}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <>
            <MessageCircle className="h-5 w-5" />
            Comments
          </>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4 overflow-hidden p-4 pt-0">
        {' '}
        {/* List of comments */}
        <div className="max-h-94 space-y-4 overflow-y-auto pr-2 lg:max-h-none lg:flex-1">
          {' '}
          {discussionItems.length > 0 ? (
            discussionItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 pt-1.5 pl-1.5">
                <UserAvatar user={item.user} className="h-8 w-8" />
                <div className="flex-1 rounded-md bg-muted p-3 text-sm shadow backdrop-blur-lg">
                  {/* --- ¡AQUÍ ESTÁ EL CAMBIO! --- */}{' '}
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-primary">{item.user.name}</p>
                    <time className="text-xs text-muted-foreground">{formatTimestamp(item.created_at)}</time>{' '}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{item.comment}</p>{' '}
                  {item.is_initial && <p className="mt-1 text-xs text-muted-foreground">Initial problem description</p>}{' '}
                </div>{' '}
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground">No comments yet.</p>
          )}
        </div>
        {/* Form to add a new comment */}
        <form onSubmit={submitComment} className="space-y-2 border-t-2 border-primary pt-4">
          {' '}
          <>
            <Input
              className="ring-1 hover:ring-primary"
              placeholder="Add a comment..."
              value={data.comment}
              onChange={(e) => setData('comment', e.target.value)}
            />
            <InputError message={errors.comment} />
          </>
          <div className="flex justify-end">
            <Button size="sm" disabled={processing} className="hover:bg-primary/60">
              <Send />
              {processing ? 'Posting...' : 'Post comment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
