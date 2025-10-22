import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import { Ticket } from '@/types/ticket';
import { router, useForm } from '@inertiajs/react';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, CircleX, Heading1, Heading2, Heading3, Italic, List, ListOrdered, PlusCircle, Send, X } from 'lucide-react';
import * as React from 'react';

interface EmailContact {
  id: number;
  name: string;
  email: string;
}
// Define the props for the modal
interface RequestPartsModalProps {
  purchasingContacts: EmailContact[];
  ticket: Ticket;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// The Tiptap Toolbar component (no changes needed here)
const TiptapToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }
  return (
    <div className="flex items-center justify-center gap-1 rounded-md p-1 hover:ring-ring">
      <Toggle
        className="hover:text-accent-primary bg-secondary text-secondary-foreground hover:bg-primary"
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="hover:text-accent-primary bg-secondary text-secondary-foreground hover:bg-primary"
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="hover:text-accent-primary bg-secondary text-secondary-foreground hover:bg-primary"
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>
<Separator orientation="vertical" className="h-full rounded-2xl border-3 border-secondary" />      <Toggle
        className="hover:text-accent-primary bg-secondary text-secondary-foreground hover:bg-primary"
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="hover:text-accent-primary bg-secondary text-secondary-foreground hover:bg-primary"
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-full rounded-2xl border-3 border-secondary" />
      <Toggle
        className="hover:text-accent-primary bg-secondary text-secondary-foreground hover:bg-primary"
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        className="hover:text-accent-primary bg-secondary text-secondary-foreground hover:bg-primary"
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
    </div>
  );
};

export function RequestPartsModal({ ticket, purchasingContacts, isOpen, onOpenChange }: RequestPartsModalProps) {
  const { data, setData, errors, reset } = useForm({
    to: [] as string[],
    cc: '',
    subject: `Part Request for Ticket #${ticket.id}: ${ticket.title}`,
    body: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        // This ensures headings, lists, etc. are styled correctly without conflicts.
        class:
          'min-h-[240px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4',
      },
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset();
      setData('subject', `Part Request for Ticket #${ticket.id}: ${ticket.title}`);

      const emailTemplate = `
                <p>Hello Purchasing Team,</p>
                <p></p>
                <p>We require parts for the following maintenance ticket:</p>
                
                <p>Parts Needed:</p>
                <ul>
                    <li>[Enter part name and quantity here]</li>
                </ul>
                <p></p>
                <p>Thank you,</p>
                <p></p>
                
                <p>JST Power Equipment</p>
            `;

      editor?.commands.setContent(emailTemplate);
    }
  }, [isOpen, ticket, editor]); // Added editor to the dependency array

  const addRecipient = (email: string) => {
    if (!data.to.includes(email)) {
      setData('to', [...data.to, email]);
    }
  };

  const removeRecipient = (email: string) => {
    setData(
      'to',
      data.to.filter((r) => r !== email),
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailBody = editor?.getHTML() || '';

    router.post(
      route('tickets.request-parts', ticket.id),
      {
        ...data,
        body: emailBody,
      },
      {
        onStart: () => setIsSubmitting(true),
        onFinish: () => setIsSubmitting(false),
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Request Parts</DialogTitle>
          <DialogDescription>Compose and send an email to the purchasing department for the parts needed for this ticket.</DialogDescription>
        </DialogHeader>

        <form id="request-parts-form" onSubmit={submit} className="grid gap-4 py-4" autoComplete="off">
          <div className="space-y-2">
            <Label>To:</Label>
            <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border p-2 ring ring-secondary hover:bg-accent hover:ring-ring">
              {data.to.map((email) => (
                <Badge
                  key={email}
                  variant="default"
                  className="gap-1 text-destructive-foreground hover:bg-destructive"
                  onClick={() => removeRecipient(email)}
                >
                  {email}
                  <button type="button" onClick={() => removeRecipient(email)}>
                    <X className="h-3 w-3 rounded text-destructive-foreground hover:bg-destructive" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Suggestions:</span>
              {purchasingContacts.map((contact) => (
                <button key={contact.id} type="button" onClick={() => addRecipient(contact.email)}>
                  <Badge className="bg-secondary text-secondary-foreground hover:bg-primary hover:text-accent-primary">
                    <PlusCircle className="h-4 w-4 stroke-3" />
                    {contact.name}</Badge>
                </button>
              ))}
            </div>
            <InputError message={errors.to} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc">Cc (optional, comma-separated):</Label>
            <Input
              className="ring ring-secondary hover:bg-accent hover:ring-ring"
              id="cc"
              type="text"
              value={data.cc}
              onChange={(e) => setData('cc', e.target.value)}
            />
            <InputError message={errors.cc} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              className="ring ring-secondary hover:bg-accent hover:ring-ring"
              id="subject"
              value={data.subject}
              onChange={(e) => setData('subject', e.target.value)}
              required
            />
            <InputError message={errors.subject} />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <TiptapToolbar editor={editor} />
            <EditorContent editor={editor} className="rounded-lg ring ring-secondary hover:ring-ring" />
            <InputError message={errors.body} />
          </div>
        </form>
        <DialogFooter>
          <Button className="hover:bg-destructive hover:text-destructive-foreground" variant="outline" onClick={() => onOpenChange(false)}>
            <CircleX />
            Cancel
          </Button>
          <Button type="submit" form="request-parts-form" disabled={isSubmitting}>
            <Send />
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
