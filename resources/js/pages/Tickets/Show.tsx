import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { EmailContact, User, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ActionsCard } from './Components/ActionsCard';
import { ActivityLogCard } from './Components/ActivityLogCard';
import { DiscussionCard } from './Components/DiscussionCard';
import { FullDetailsCard } from './Components/FullDetailsCard';
import { KeyInfoCard } from './Components/KeyInfoCard';
import { RelatedTicketsCard } from './Components/RelatedTicketsCard';
import { Ticket, TicketStatus } from '@/types/ticket';

// --- Type Definitions for this page ---
// These should match the data sent from your TicketController@show method

interface ShowPageProps {
  ticket: Ticket;
  timeOpen: string;
  solvedBy: User | null;
  statuses: TicketStatus[];
  purchasingContacts: EmailContact[];
  relatedTickets: Ticket[];
}

export default function Show({ ticket, timeOpen, solvedBy, statuses, purchasingContacts, relatedTickets }: ShowPageProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Tickets',
      href: route('tickets.index'),
    },
    {
      title: `Ticket #${ticket.id}`,
      href: route('tickets.show', ticket.id),
      isCurrent: true,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Ticket #${ticket.id}`} />

      <div className="p-6">
        {/* --- Main Two-Column Grid Layout --- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* --- Left Column (Main Details) --- */}
          <div className="space-y-6 lg:col-span-2">
            <KeyInfoCard ticket={ticket} timeOpen={timeOpen} solvedBy={solvedBy} />
            <ActionsCard ticket={ticket} statuses={statuses} purchasingContacts={purchasingContacts} />
            <FullDetailsCard ticket={ticket} />
            <RelatedTicketsCard relatedTickets={relatedTickets} />
          </div>

          {/* --- Right Column (History & Discussion) --- */}
          <div className="sticky space-y-6 lg:col-span-1">
            <DiscussionCard ticket={ticket} />
            <ActivityLogCard ticket={ticket} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
