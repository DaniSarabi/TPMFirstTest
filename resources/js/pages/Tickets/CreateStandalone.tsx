import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Machine } from '@/types/machine';
import { PageProps, BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { ChevronLeft, LoaderCircle, AlertTriangle, Camera, X } from 'lucide-react';
import InputError from '@/components/input-error';
import * as React from 'react';

interface CreateStandaloneTicketProps extends PageProps {
  machines: Machine[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Start Inspection', href: route('inspections.start') }, 
    { title: 'Report Fault', href: '#', isCurrent: true }
];

export default function CreateStandaloneTicket({ machines }: CreateStandaloneTicketProps) {
  // 1. Añadimos 'image' al formulario
  const { data, setData, post, processing, errors, reset } = useForm({
    machine_id: '',
    title: '',
    description: '',
    priority: 1,
    image: null as File | null, // <-- NUEVO
  });

  // 2. Estado para el preview de la imagen
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
    // Inertia se encarga de 'multipart/form-data' automáticamente
    post(route('tickets.store.standalone'), {
      onSuccess: () => {
        reset();
        setImagePreview(null);
      },
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Report Fault" />
      
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        <Link 
            href={route('inspections.start')} 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Start Inspection
        </Link>
        
        <Card className="shadow-lg drop-shadow-lg border-0">
          <CardHeader>
            <CardTitle>Report a New Fault</CardTitle>
            <CardDescription>Create a new ticket. This fault is not part of a scheduled inspection.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* --- 3. NUEVO: Lógica para subir foto --- */}
              <div>
                <Label htmlFor="image" className="font-semibold">Mandatory Photo</Label>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                      <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
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
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Camera className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (MAX. 2MB)</p>
                      </div>
                      <input id="image" type="file" className="hidden" onChange={handleImageChange} accept="image/png, image/jpeg" />
                    </label>
                  )}
                </div>
                <InputError message={errors.image} />
              </div>
              
              <div>
                <Label htmlFor="machine">Machine</Label>
                <Select onValueChange={(value) => setData('machine_id', value)} value={data.machine_id}>
                  <SelectTrigger id="machine"><SelectValue placeholder="Select a machine..." /></SelectTrigger>
                  <SelectContent>{machines.map(machine => <SelectItem key={machine.id} value={machine.id.toString()}>{machine.name}</SelectItem>)}</SelectContent>
                </Select>
                <InputError message={errors.machine_id} />
              </div>
              
              <div>
                <Label htmlFor="title">Title (Brief summary of the fault)</Label>
                <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                <InputError message={errors.title} />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Add more details about the fault..." />
                <InputError message={errors.description} />
              </div>
              
               <div>
                <Label htmlFor="priority">Priority</Label>
                <Select onValueChange={(value) => setData('priority', parseInt(value))} value={data.priority.toString()}>
                  <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Warning (Needs attention)</SelectItem>
                    <SelectItem value="2">Critical (Stops production)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {data.priority === 2 && (
                  <Alert variant="destructive" className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5" />
                    <div><AlertDescription><b>Critical Priority</b> should only be used if the machine is stopped or cannot continue production safely.</AlertDescription></div>
                  </Alert>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                  {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
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

