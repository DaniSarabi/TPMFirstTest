import { EventContentArg } from '@fullcalendar/core';

// This component receives event information from FullCalendar and returns custom JSX.
export function CustomEventContent({ event }: EventContentArg) {
  const { status } = event.extendedProps;
  const isScheduled = status === 'scheduled';

  // Define the color for the status bar based on the event's status
    const statusColor: { [key: string]: string } = {
        completed: 'bg-green-300',
        completed_overdue: 'bg-green-600',
        overdue: 'bg-red-500',
        in_progress: 'bg-yellow-300',
        in_progress_overdue: 'bg-yellow-600',
    };

    const colorClass = statusColor[status];

  return (
    <div className="custom-event-wrapper">
      <div className="custom-event-title">{event.title}</div>

      {/* Only show the status bar if the event is NOT in the default "scheduled" state */}
      {!isScheduled && <div className={`custom-event-status-bar ${colorClass}`} />}
    </div>
  );
}
