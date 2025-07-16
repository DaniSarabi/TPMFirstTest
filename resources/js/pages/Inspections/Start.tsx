import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Camera, Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

// Define the shape of the machine data passed from the controller
interface Machine {
  id: number;
  name: string;
}

// Define the props for the page
interface StartPageProps {
  machines: Machine[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Inspections',
    href: route('inspections.start'),
    isCurrent: true,
  },
];

// A reusable Combobox component for selecting a machine
function MachineCombobox({ machines }: { machines: Machine[] }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  const handleSelect = (currentValue: string) => {
    const selectedMachineId = currentValue === value ? '' : currentValue;
    setValue(selectedMachineId);
    setOpen(false);
    if (selectedMachineId) {
      // --- ACTION: Send a POST request to create the inspection report ---
      // Inertia will automatically follow the redirect to the "Perform" page.
      router.post(route('inspections.store'), {
        machine_id: selectedMachineId,
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value ? machines.find((machine) => String(machine.id) === value)?.name : 'Select machine...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 ring-ring">
        <Command>
          <CommandInput placeholder="Search machine..." />
          <CommandList>
            <CommandEmpty>No machine found.</CommandEmpty>
            <CommandGroup>
              {machines.map((machine) => (
                <CommandItem key={machine.id} value={String(machine.id)} onSelect={handleSelect}>
                  <Check className={cn('mr-2 h-4 w-4', value === String(machine.id) ? 'opacity-100' : 'opacity-0')} />
                  {machine.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function Start({ machines }: StartPageProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Start Inspection" />
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center p-4">
        <Card className="w-full max-w-4xl ring-1 ring-ring">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Start a New Inspection</CardTitle>
            <CardDescription className="text-center">Select a machine by scanning its QR code or choosing from the list.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid items-center gap-8 md:grid-cols-2">
              {/* Left Column: Scan QR Code */}
              <div className="flex flex-col items-center justify-center space-y-4 border-r-0 p-6 md:border-r">
                <h3 className="text-lg font-semibold">Scan QR Code</h3>
                <Button size="lg" className="h-24 w-full text-2xl font-bold">
                  <Camera className="mr-4 !h-10 !w-10" />
                  Open Camera
                </Button>
              </div>

              {/* Right Column: Choose Manually */}
              <div className="flex flex-col items-center justify-center space-y-4 p-6">
                <h3 className="text-lg font-semibold">Choose Manually</h3>
                <MachineCombobox machines={machines} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
