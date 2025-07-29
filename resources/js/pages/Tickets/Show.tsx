import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Ticket, User } from './Columns';
import { ActivityLogCard } from './Components/ActivityLogCard';
import { DiscussionCard } from './Components/DiscussionCard';
import { FullDetailsCard } from './Components/FullDetailsCard';
import { KeyInfoCard } from './Components/KeyInfoCard';

// --- Type Definitions for this page ---
// These should match the data sent from your TicketController@show method

interface ShowPageProps {
  ticket: Ticket;
  timeOpen: string;
  solvedBy: User | null;
}

export default function Show({ ticket, timeOpen, solvedBy }: ShowPageProps) {
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
            <FullDetailsCard ticket={ticket} />
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Actions Card...</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Parts Log</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Parts Log Card...</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Related Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Related Tickets Card...</p>
              </CardContent>
            </Card>
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
