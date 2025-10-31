import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Ticket } from '@/types/ticket';
import { router } from '@inertiajs/react';
import { Mail, Send, X } from 'lucide-react';
import * as React from 'react';

interface EmailBuilderSectionProps {
  ticket: Ticket;
  newStatusId: number;
  comment?: string;
  onCancel: () => void;
}

export function EmailBuilderSection({ ticket, newStatusId, comment, onCancel }: EmailBuilderSectionProps) {
  const [emailTemplate, setEmailTemplate] = React.useState<string>('');
  const [emailRecipient, setEmailRecipient] = React.useState<string>('');
  const [emailMessage, setEmailMessage] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);

    router.patch(
      route('tickets.change-status-with-email', ticket.id),
      {
        status_id: newStatusId,
        comment: comment || null,
        send_email: true,
        email_data: {
          template: emailTemplate,
          recipient: emailRecipient,
          message: emailMessage,
        },
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          onCancel();
        },
        onFinish: () => {
          setIsSubmitting(false);
        },
      },
    );
  };

  const handleCancelEmail = () => {
    // Submit without email
    router.patch(
      route('tickets.change-status', ticket.id),
      {
        status_id: newStatusId,
        comment: comment || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          onCancel();
        },
      },
    );
  };

  return (
    <Card className="transition-500 bg-primary/10 overflow-y-auto border-0 drop-shadow-lg transition-transform ease-in-out hover:-translate-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Email Notification</CardTitle>
          </div>
          <Button className='hover:bg-destructive hover:text-destructive-foreground' variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>Send an email notification along with this status change</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Template Selector */}
        <div className="space-y-2">
          <Label htmlFor="email-template">Email Template</Label>
          <Select value={emailTemplate} onValueChange={setEmailTemplate}>
            <SelectTrigger className='bg-background border-0 hover:cursor-pointer' id="email-template">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="purchasing">Purchasing Department</SelectItem>
              <SelectItem value="quote">Request Quote (Suppliers)</SelectItem>
              <SelectItem value="external">External Vendor Contact</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recipient Email */}
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Email</Label>
          <Input
          className='bg-background'
            id="recipient"
            type="email"
            placeholder="email@example.com"
            value={emailRecipient}
            onChange={(e) => setEmailRecipient(e.target.value)}
          />
        </div>

        {/* Email Message Preview */}
        <div className="space-y-2">
          <Label htmlFor="message">Additional Message (optional)</Label>
          <Textarea
            id="message"
            className="min-h-[120px] w-full rounded-md  bg-background px-3 py-2 text-sm"
            placeholder="Add any additional details for the email..."
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
          />
        </div>

        {/* Placeholder Notice */}
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Full email builder with templates and preview coming soon. For now, this will send a basic notification.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={!emailTemplate || !emailRecipient || isSubmitting} className="flex-1">
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Sending...' : 'Send Email & Update Status'}
          </Button>
          <Button variant="outline" onClick={handleCancelEmail} disabled={isSubmitting}>
            Skip Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
