import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BadgeAlert, ClockArrowUp, History, Pencil, PlusCircle, Ticket, Wrench } from 'lucide-react';
import React from 'react';
import { Machine } from './Columns'; // Import the Machine type from your columns file
import { EditMachineModal } from './EditMachineModal';

// Define the props for the Show page
interface ShowPageProps {
  machine: Machine;
  uptime: {
    since: string | null;
    duration: string | null;
  };
  stats: {
    subsystems_count: number;
    inspection_points_count: number;
  };
}

export default function Show({ machine, uptime, stats }: ShowPageProps) {
  const [editModalIsOpen, setEditModalIsOpen] = React.useState(false);

  // Define the breadcrumbs for this page, including a link back to the index
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Machines',
      href: route('machines.index'),
    },
    {
      title: machine.name,
      href: route('machines.show', machine.id),
      isCurrent: true,
    },
  ];

  // Helper to get the correct color for the status badge
  const getStatusColor = (status: string) => {
    return {
      'In Service': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Under Maintenance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Out of Service': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      New: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    }[status];
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Machine: ${machine.name}`} />

      <div className="space-y-6 p-6">
        {/* --- Main Machine Details Card --- */}
        <Card>
          <div className="grid md:grid-cols-2">
            {/* Left Column: Details */}
            <div className="flex flex-col p-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Badge className={cn('text-sm', getStatusColor(machine.status))}>{machine.status}</Badge>
                  <Button variant="outline" size="icon" onClick={() => setEditModalIsOpen(true)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <h1 className="mb-2 text-3xl font-bold">{machine.name}</h1>
                <p className="mb-6 leading-relaxed text-muted-foreground">{machine.description || 'No description provided.'}</p>
                <div className="mt-4 gap-2">
                  {uptime.since && (
                    <div className="flex items-center text-sm">
                      <History className="mr-2 h-4 w-4 text-muted-foreground" />

                      <span className="text-muted-foreground">In Service Since:</span>

                      <span className="ml-auto font-semibold">{uptime.since}</span>
                    </div>
                  )}

                  {uptime.duration && (
                    <div className="flex items-center text-sm">
                      <ClockArrowUp className="mr-2 h-4 w-4 text-muted-foreground" />

                      <span className="text-muted-foreground">Uptime Duration:</span>

                      <span className="ml-auto font-semibold">{uptime.duration}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* --- ACTION 2: Add the new stats grid --- */}
              <div className="mt-auto grid grid-cols-2 gap-4 border-t pt-6">
                <div className="flex items-center gap-3">
                  <Wrench className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Subsystems</p>
                    <p className="text-lg font-bold">{stats.subsystems_count}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Ticket className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Open Tickets</p>
                    <p className="text-lg font-bold">0</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BadgeAlert className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="text-lg font-bold">{stats.inspection_points_count}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <History className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Inspected</p>
                    <p className="text-lg font-bold">N/A</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Image */}
            <div className="flex items-center justify-center bg-muted/50 p-6">
              {machine.image_url ? (
                <img src={machine.image_url} alt={`Image of ${machine.name}`} className="max-h-96 w-full rounded-md object-contain" />
              ) : (
                <div className="flex h-64 w-full items-center justify-center rounded-md bg-muted">
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* --- Subsystems Section --- */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subsystems</CardTitle>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Subsystem
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* --- ACTION 2: Replaced the simple list with an Accordion --- */}
            {machine.subsystems.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {machine.subsystems.map((subsystem) => (
                  <AccordionItem key={subsystem.id} value={`item-${subsystem.id}`}>
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex w-full items-center justify-between">
                        <div>
                          <p className="text-left font-semibold">{subsystem.name}</p>
                          <p className="text-left text-sm text-muted-foreground">{subsystem.inspection_points.length} inspection points</p>
                        </div>
                        <div className="mr-4 flex items-center gap-2">
                          <Button variant="secondary" size="sm">
                            Manage Points
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="ml-4 border-l-2 p-4 pl-6">
                      <h4 className="mb-2 font-semibold">Inspection Points:</h4>
                      <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                        {subsystem.inspection_points.length > 0 ? (
                          subsystem.inspection_points.map((point) => <li key={point.id}>{point.name}</li>)
                        ) : (
                          <li>No inspection points for this subsystem.</li>
                        )}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">This machine does not have any subsystems yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <EditMachineModal machine={machine} isOpen={editModalIsOpen} onOpenChange={setEditModalIsOpen} />
    </AppLayout>
  );
}
