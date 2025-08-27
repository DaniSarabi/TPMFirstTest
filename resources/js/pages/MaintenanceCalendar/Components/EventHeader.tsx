import React from 'react';
import { ScheduledMaintenanceEvent } from '@/types/maintenance';
import { Eye, Ticket, Wrench, Zap } from 'lucide-react';

const InfoCard = ({ icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null }) => (
    <div className="flex items-center space-x-3 rounded-lg border bg-primary/50 p-3 text-primary-foreground">
        <div className="rounded-full bg-primary p-2">{React.createElement(icon, { className: 'h-5 w-5 text-primary-foreground' })}</div>
        <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-sm text-primary-foreground/80">{value ?? 'N/A'}</p>
        </div>
    </div>
);

interface Props {
    event: ScheduledMaintenanceEvent;
}

export function EventHeader({ event }: Props) {
    const { schedulableName, machine_image_url, subsystem_count, open_tickets_count, current_uptime, last_maintenance_date } = event.extendedProps;

    return (
        <div className="space-y-4">
            <img
                src={machine_image_url || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image'}
                alt={schedulableName}
                className="aspect-[16/9] h-auto w-full rounded-lg object-cover"
            />
            <div className="grid grid-cols-2 gap-3">
                <InfoCard icon={Wrench} label="Subsystems" value={subsystem_count} />
                <InfoCard icon={Ticket} label="Open Tickets" value={open_tickets_count} />
                <InfoCard icon={Zap} label="Current Uptime" value={current_uptime} />
                <InfoCard icon={Eye} label="Last Maintenance" value={last_maintenance_date} />
            </div>
        </div>
    );
}
