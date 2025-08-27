import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Machine } from '@/types/machine';
import { MaintenanceTemplate, ScheduledMaintenanceEvent } from '@/types/maintenance';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import { EventClickArg } from '@fullcalendar/core';
import { Head } from '@inertiajs/react';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { EventDetailsModal } from './Components/EventDetailsModal'; // Import the new modal
import { ScheduleMaintenanceModal } from './Components/ScheduleMaintenanceModal';
import { CustomEventContent } from './Components/CustomEventContent';

interface Props extends PageProps {
  events: ScheduledMaintenanceEvent[];
  machines: Machine[];
  templates: MaintenanceTemplate[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Calendar',
    href: route('maintenance-calendar.index'),
    isCurrent: true,
  },
];
export default function MaintenanceCalendarIndex({ events, machines, templates }: Props) {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduledMaintenanceEvent | null>(null);

  // This function is called by FullCalendar when an event is clicked
  const handleEventClick = (clickInfo: EventClickArg) => {
    // We find our full event object from the props using the ID
    const event = events.find((e) => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setIsDetailsModalOpen(true);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Maintenance Calendar" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Maintenance Calendar</h1>
              <p className="text-muted-foreground">A complete overview of all scheduled tasks.</p>
            </div>
            <Button onClick={() => setIsScheduleModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Schedule Maintenance
            </Button>
          </div>

          <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg dark:bg-gray-800">
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              weekends={true}
              events={events}
              aspectRatio={1.8}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek,dayGridDay',
              }}
              eventClick={handleEventClick} // Add the event click handler
              eventContent={CustomEventContent}
            />
          </div>
        </div>
      </div>

      <ScheduleMaintenanceModal isOpen={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen} machines={machines} templates={templates} />

      <EventDetailsModal isOpen={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen} event={selectedEvent} />
    </AppLayout>
  );
}
