import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import AppLayout from '@/layouts/app-layout';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { EmailContact, User, type BreadcrumbItem } from '@/types';
import { Ticket, TicketStatus } from '@/types/ticket';
import { Head } from '@inertiajs/react';
import React from 'react';
import { ActionsCard } from './Components/ActionsCard';
import { ActivityLogCard } from './Components/ActivityLogCard';
import { DiscussionCard } from './Components/DiscussionCard';
import { EmailBuilderSection } from './Components/EmailBuilderSection';
import { FullDetailsCard } from './Components/FullDetailsCard';
import { KeyInfoCard } from './Components/KeyInfoCard';
import { RelatedTicketsCard } from './Components/RelatedTicketsCard';
import { ResolutionCard } from './Components/ResolutionCard';

// --- Type Definitions for this page ---
// These should match the data sent from your TicketController@show method

interface ShowPageProps {
  ticket: Ticket & { is_machine_deleted?: boolean };
  timeOpen: string;
  solvedBy: User | null;
  statuses: TicketStatus[];
  purchasingContacts: EmailContact[];
  relatedTickets: Ticket[];
}

export default function Show({ ticket, timeOpen, solvedBy, statuses, purchasingContacts, relatedTickets }: ShowPageProps) {
  const [emailBuilderVisible, setEmailBuilderVisible] = React.useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = React.useState<number | null>(null);
  const [statusComment, setStatusComment] = React.useState<string>('');

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

  const machineName = ticket.machine?.name || 'Deleted Machine';

  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Ticket #${ticket.id}`} />

      <div className="p-6">
        {/* --- Main Two-Column Grid Layout --- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* --- Left Column (Main Details) --- */}
          <div className="space-y-6 lg:col-span-2">
            <KeyInfoCard ticket={ticket} timeOpen={timeOpen} solvedBy={solvedBy} />
            {!ticket.is_machine_deleted && (
              <ActionsCard
                ticket={ticket}
                statuses={statuses}
                purchasingContacts={purchasingContacts}
                onEmailToggle={setEmailBuilderVisible}
                onStatusSelect={(statusId) => {
                  setSelectedNewStatus(statusId);
                }}
              />
            )}
            {emailBuilderVisible && selectedNewStatus && (
              <EmailBuilderSection
                ticket={ticket}
                newStatusId={selectedNewStatus}
                comment={statusComment}
                onCancel={() => {
                  setEmailBuilderVisible(false);
                  setSelectedNewStatus(null);
                }}
              />
            )}
            <ResolutionCard ticket={ticket} />
            <FullDetailsCard ticket={ticket} />
            <RelatedTicketsCard relatedTickets={relatedTickets} />
          </div>

          {/* --- Right Column (History & Discussion) --- */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:col-span-1 lg:space-y-0">
            {isDesktop ? (
              <ResizablePanelGroup
                direction="vertical"
                // Ajusta este 'h' (100vh - navbar - padding)
                className="h-[calc(100vh-8rem)] rounded-lg border-0 shadow-none "
              >
                <ResizablePanel className="p-4" minSize={30} defaultSize={50}>
                  {/* DiscussionCard ahora debe ser h-full */}
                  <DiscussionCard ticket={ticket} />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel className="p-4" minSize={20} defaultSize={50}>
                  {/* ActivityLogCard ahora debe ser h-full */}
                  <ActivityLogCard ticket={ticket} />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              // --- VISTA MÓVIL (Apilada) ---
              <>
                <DiscussionCard ticket={ticket} />
                <ActivityLogCard ticket={ticket} />
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
