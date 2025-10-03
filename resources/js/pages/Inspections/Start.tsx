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
import { QrScannerModal } from './Components/QrScannerModal';
import { Machine } from '@/types/machine';

// Define the shape of the machine data passed from the controller

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
      router.post(route('inspections.store'), {
        machine_id: selectedMachineId,
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="text-md h-12 w-full justify-between">
          {value ? machines.find((machine) => String(machine.id) === value)?.name : 'Select machine...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] border-border/50 bg-background/80 p-0 backdrop-blur-sm">
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
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);

  React.useEffect(() => {
        document.body.classList.add('overflow-hidden');
        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, []);
    
  const handleScan = (url: string) => {
    if (url) {
      router.visit(url);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Start Inspection" />
      <div
        className="flex min-h-full items-center justify-center bg-cover bg-center p-4"
        style={{ backgroundImage: "url('/home.png')" }}
      >
        <Card className="w-full max-w-4xl border-0 bg-background/60 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold">Start a New Inspection</CardTitle>
            <CardDescription className="text-center text-lg">Select a machine by scanning its QR code or choosing from the list.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid items-stretch gap-8 md:grid-cols-2">
              {/* Left Column: Scan QR Code */}
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-primary/10 p-8 transition-all hover:bg-primary/20">
                <h3 className="text-xl font-semibold">Scan QR Code</h3>
                <p className="text-center text-sm text-muted-foreground">The fastest way to start. Point your camera at the machine's QR code.</p>
                <Button size="lg" className="h-16 w-full text-lg" onClick={() => setIsScannerOpen(true)}>
                  <Camera className="mr-4 h-8 w-8" />
                  Open Camera
                </Button>
              </div>

              {/* Right Column: Choose Manually */}
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-primary/10 p-8 transition-all hover:bg-primary/20">
                <h3 className="text-xl font-semibold">Choose Manually</h3>
                <p className="text-center text-sm text-muted-foreground">If you can't scan, find the machine in the complete list.</p>
                <div className="w-full">
                  <MachineCombobox machines={machines} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <QrScannerModal isOpen={isScannerOpen} onOpenChange={setIsScannerOpen} onScan={handleScan} />
    </AppLayout>
  );
}
