import InputError from '@/components/input-error';
import { AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils'; // Asumimos que tienes cn
import { BreadcrumbItem, PageProps } from '@/types';
import { Machine } from '@/types/machine';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertTriangle, AlignLeft, Camera, ChevronLeft, FileText, LoaderCircle, Send, Wrench, X } from 'lucide-react'; // 1. Importar más iconos
import * as React from 'react';

interface CreateStandaloneTicketProps extends PageProps {
  machines: Machine[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Start Inspection', href: route('inspections.start') },
  { title: 'Report Fault', href: '#', isCurrent: true },
];

export default function CreateStandaloneTicket({ machines }: CreateStandaloneTicketProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    machine_id: '',
    title: '',
    description: '',
    priority: 1,
    image: null as File | null,
  });

  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setData('image', file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    post(route('tickets.store.standalone'), {
      onSuccess: () => {
        reset();
        setImagePreview(null);
      },
    });
  };

  // 2. Helper para los estilos de foco
  const ringStyles = 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Report Fault" />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href={route('inspections.start')} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4" />
          Back to Start Inspection
        </Link>

        <Card className="border-0 bg-card shadow-lg drop-shadow-lg">
          <CardHeader>
            <CardTitle>Report a New Fault</CardTitle>
            <CardDescription>Create a new ticket. This fault is not part of a scheduled inspection.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="image" className="flex items-center gap-2 font-semibold">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  Mandatory Photo
                </Label>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                      <img src={imagePreview} alt="Upload preview" className="h-full w-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => {
                          setData('image', null);
                          setImagePreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="image"
                      className={cn(
                        'flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card hover:bg-muted',
                        ringStyles,
                      )}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Camera className="mb-3 h-10 w-10 text-muted-foreground" />
                        {/* 3. Texto de Drag and Drop eliminado */}
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span>
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (MAX. 2MB)</p>
                      </div>
                      {/* 4. accept="image/*" para filtrar solo imágenes */}
                      <input id="image" type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                    </label>
                  )}
                </div>
                <InputError message={errors.image} />
              </div>

              <div>
                <Label htmlFor="machine" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  Machine
                </Label>
                <Select onValueChange={(value) => setData('machine_id', value)} value={data.machine_id}>
                  <SelectTrigger id="machine" className={cn('mt-1 shadow-none bg-muted hover:bg-accent hover:cursor-pointer', ringStyles)}>
                    <SelectValue placeholder="Select a machine..." />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id.toString()}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <InputError message={errors.machine_id} />
              </div>

              <div>
                <Label htmlFor="title" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Title (Brief summary of the fault)
                </Label>
                <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} className={cn('mt-1 shadow-none bg-muted hover:bg-accent', ringStyles)} />
                <InputError message={errors.title} />
              </div>

              <div>
                <Label htmlFor="description" className="flex items-center gap-2">
                  <AlignLeft className="h-4 w-4 text-muted-foreground" />
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Add more details about the fault..."
                  className={cn('mt-1 shadow-none bg-muted hover:bg-accent', ringStyles)}
                />
                <InputError message={errors.description} />
              </div>

              <div>
                <Label htmlFor="priority" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  Priority
                </Label>
                <Select onValueChange={(value) => setData('priority', parseInt(value))} value={data.priority.toString()}>
                  <SelectTrigger id="priority" className={cn('mt-1 shadow-none bg-muted hover:bg-accent hover:cursor-pointer', ringStyles)}>
                    {/* 5. Mostrar el color y texto en el botón del Select */}
                    <div className="flex items-center gap-2">
                      {data.priority === 1 ? (
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                      )}
                      <span>{data.priority === 1 ? 'Warning' : 'Critical'}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span>Warning (Needs attention)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span>Critical (Stops production)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 6. Contenedor para la alerta para que no "brinque" el layout */}
              <div className="max-w-[415px]">
                {data.priority === 2 && (
                  // 7. Usar la variante "destructive" para el color rojo
                  <div className="flex items-center gap-4 rounded-md bg-red-100 p-4 text-red-600">
                    <AlertTriangle className="h-10 w-10" />
                    <div>
                      <AlertDescription>
                        <b>Critical Priority</b> Should only be used if the machine is stopped or cannot continue production safely.
                      </AlertDescription>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={processing} size="lg">
                  {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-2 h-4 w-4" />
                  Submit Ticket
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
