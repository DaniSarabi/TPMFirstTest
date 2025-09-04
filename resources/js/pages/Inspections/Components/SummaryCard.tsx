import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Machine } from '@/types/machine';
import { Calendar, Clock, ClockArrowUp, ListCheck, ListChecks, Ticket, Wrench, History } from 'lucide-react'
import React from 'react'

const StatCard = ({ icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null }) => (
  <div className="flex items-center gap-3">
    {React.createElement(icon, { className: 'h-8 w-8 text-primary-foreground/80' })}
    <div>
      <p className="text-sm font-medium text-primary-foreground/80">{label}</p>
      <p className="text-lg font-bold">{value ?? 'N/A'}</p>
    </div>
  </div>
);


interface SummaryCardProps {
  machine: Machine;
  uptime: {
    since: string | null;
    duration: string | null;
  };
  stats: any;
}

export function SummaryCard({ machine, stats, uptime }: SummaryCardProps) {
  return (
    <Card className="border-0 bg-primary p-0 text-primary-foreground shadow-lg drop-shadow-lg">
      <div className="flex flex-col md:flex-row">
        {/* Left Column: Image */}
        <div className="flex h-full w-full items-center justify-center p-6 md:w-1/3">
          <img
            src={machine.image_url || 'https://placehold.co/500x500/e2e8f0/64748b?text=No+Image'}
            alt={`Image of ${machine.name}`}
            className="h-full max-h-65 w-full rounded-xl object-cover shadow-md"
          />
        </div>

        {/* Right Column: Details and Statistics */}
        <div className="flex flex-1 flex-col p-6">
          
          <h1 className="my-4 text-3xl font-bold">{machine.name}</h1>
          <p className=" leading-relaxed text-primary-foreground/90 text-lg">{machine.description || 'No description provided.'}</p>

          {/* Statistics Grid */}
          <div className="mt-auto grid grid-cols-3 gap-x-4 gap-y-6 border-t-3 border-primary-foreground pt-6 ">
            <StatCard icon={Clock} label="Current Uptime" value={uptime.duration} />
            <StatCard icon={History} label="Last Inspection" value={stats.last_inspection_date} />
            <StatCard icon={Calendar} label="Last Maintenance" value={stats.last_maintenance_date} />
            <StatCard icon={Ticket} label="Open Tickets" value={stats.open_tickets_count} />
            <StatCard icon={Wrench} label="Subsystems" value={stats.subsystems_count} />
            <StatCard icon={ListChecks} label="Inspection Points" value={stats.inspection_points_count} />
          </div>
        </div>
      </div>
    </Card>
  );
}