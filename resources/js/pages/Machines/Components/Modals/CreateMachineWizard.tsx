import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CircleX, Send, SendHorizonal, Trash2, X } from 'lucide-react';
import * as React from 'react';

// Props for the wizard
interface CreateMachineWizardProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFinish: () => void;
}

// Define the shape of a created subsystem
interface CreatedSubsystem {
  id: number;
  name: string;
}

export function CreateMachineWizard({ isOpen, onOpenChange, onFinish }: CreateMachineWizardProps) {
  const [step, setStep] = React.useState(1);
  const [newMachineId, setNewMachineId] = React.useState<number | null>(null);
  const [axiosProcessing, setAxiosProcessing] = React.useState(false); // For axios steps
  const [submissionType, setSubmissionType] = React.useState<'continue' | 'finish'>('continue');
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  // --- Use Inertia's useForm for Step 1 ---
  const { data, setData, post, errors, reset, processing } = useForm({
    name: '',
    description: '',
    image: null as File | null,
  });

  // State for Step 2
  const [subsystemName, setSubsystemName] = React.useState('');
  const [subsystems, setSubsystems] = React.useState<string[]>([]);
  const [subsystemErrors, setSubsystemErrors] = React.useState<{ subsystems?: string[] }>({});

  // State for Step 3
  const [createdSubsystems, setCreatedSubsystems] = React.useState<CreatedSubsystem[]>([]);
  const [inspectionPointName, setInspectionPointName] = React.useState('');
  const [inspectionPoints, setInspectionPoints] = React.useState<Record<number, string[]>>({});
  const [inspectionPointErrors, setInspectionPointErrors] = React.useState<{ inspection_points?: string[] }>({});

  const handleSaveMachine = (e: React.FormEvent) => {
    e.preventDefault();

    if (newMachineId !== null) {
      // Si ya existe, no la volvemos a crear.
      // Simplemente decidimos a dónde ir.
      if (submissionType === 'finish') {
        handleClose();
      } else {
        setStep(2); // Avanzamos directo al paso 2
      }
      return; // ¡Salimos de la función!
    }

    post(route('machines.store'), {
      preserveScroll: true,
      onSuccess: (page) => {
        const flash = page.props.flash as { machine?: { id: number } };
        if (flash && flash.machine) {
          if (submissionType === 'finish') {
            // Si el usuario quería terminar, cerramos todo.
            handleClose();
          } else {
            // Si no, vamos al Paso 2
            setNewMachineId(flash.machine.id);
            setStep(2);
          }
        }
      },
    });
  };

  const handleAddSubsystem = () => {
    if (subsystemName.trim() !== '' && !subsystems.includes(subsystemName.trim())) {
      setSubsystems([...subsystems, subsystemName.trim()]);
      setSubsystemName('');
    }
  };

  const handleRemoveSubsystem = (indexToRemove: number) => {
    setSubsystems(subsystems.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveSubsystemsAndContinue = async () => {
    if (!newMachineId) return;
    setAxiosProcessing(true);
    setSubsystemErrors({});
    try {
      const response = await axios.post(route('subsystems.store', newMachineId), {
        subsystems: subsystems,
      });

      // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
      // 1. Limpiamos cualquier punto de inspección "fantasma" que haya quedado de un paso anterior.
      setInspectionPoints({});

      // 2. Guardamos los nuevos subsistemas (con sus nuevos IDs)
      setCreatedSubsystems(response.data.subsystems);

      // 3. Avanzamos al siguiente paso
      setStep(3);
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        setSubsystemErrors(error.response.data.errors);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    } finally {
      setAxiosProcessing(false);
    }
  };
  const handleAddInspectionPoint = (subsystemId: number) => {
    if (inspectionPointName.trim() !== '') {
      const currentPoints = inspectionPoints[subsystemId] || [];
      if (!currentPoints.includes(inspectionPointName.trim())) {
        setInspectionPoints({
          ...inspectionPoints,
          [subsystemId]: [...currentPoints, inspectionPointName.trim()],
        });
      }
      setInspectionPointName('');
    }
  };

  const handleRemoveInspectionPoint = (subsystemId: number, indexToRemove: number) => {
    const currentPoints = inspectionPoints[subsystemId] || [];
    setInspectionPoints({
      ...inspectionPoints,
      [subsystemId]: currentPoints.filter((_, index) => index !== indexToRemove),
    });
  };

  const handleSaveInspectionPointsAndFinish = async () => {
    setAxiosProcessing(true);
    setInspectionPointErrors({});
    try {
      await axios.post(route('inspection-points.store'), {
        inspection_points: inspectionPoints,
      });
      handleClose();
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        setInspectionPointErrors(error.response.data.errors);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    } finally {
      setAxiosProcessing(false);
    }
  };

  const handleClose = () => {
    reset();
    setSubsystemName('');
    setSubsystems([]);
    setCreatedSubsystems([]);
    setInspectionPointName('');
    setInspectionPoints({});
    setSubsystemErrors({});
    setInspectionPointErrors({});
    setStep(1);
    setNewMachineId(null);
    onOpenChange(false);
    onFinish();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setData('image', file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setData('image', null);
      setImagePreview(null);
    }
  };

  const renderStepContent = () => {
    const progressPercent = Math.round((step / 3) * 100);

    return (
      <>
        <div className="space-y-2 p-4">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-primary">Step {step} of 3</span>
            <span className="text-muted-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="relative overflow-hidden p-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step} // La key es el paso, esto activa la animación
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {step === 1 && (
                <form id="machine-form" onSubmit={handleSaveMachine} className="grid gap-4 py-4" autoComplete="off">
                  <div className="space-y-2">
                    <Label htmlFor="name">Machine Name</Label>
                    <Input
                      className="bg-muted shadow-none hover:bg-accent"
                      id="name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      required
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      className="bg-muted shadow-none hover:bg-accent"
                      id="description"
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Machine Image (Optional)</Label>
                    {imagePreview ? (
                      <div className="relative w-48 h-48 rounded-lg overflow-hidden">
                        <img src={imagePreview} alt="Machine preview" className="h-full w-full object-cover" />
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
                      <Input
                        className="bg-muted shadow-none hover:bg-accent hover:cursor-pointer"
                        id="image"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg" // 6. Aceptar solo imágenes
                        onChange={handleImageChange} // 7. Usar el nuevo handler
                      />
                    )}
                    {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}
                  </div>
                </form>
              )}
              {step === 2 && (
                <div className="grid gap-4 px-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="subsystem-name">Subsystem Name</Label>
                    <div className="flex space-x-2">
                      <Input
                        className="bg-muted shadow-none hover:bg-accent"
                        id="subsystem-name"
                        value={subsystemName}
                        onChange={(e) => setSubsystemName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubsystem();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddSubsystem}>
                        Add
                      </Button>
                    </div>
                    {subsystemErrors.subsystems && <p className="mt-1 text-sm text-red-500">{subsystemErrors.subsystems[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Added Subsystems</Label>
                    {subsystems.length > 0 ? (
                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-md bg-muted p-2">
                        {subsystems.map((name, index) => (
                          <div key={index} className="flex items-center justify-between rounded-full bg-primary p-1 text-primary-foreground">
                            <span className="ml-3">{name}</span>
                            {/* 9. Icono de Basura para Borrar */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-4 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleRemoveSubsystem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-sm text-muted-foreground">No subsystems added yet.</p>
                    )}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="grid gap-4">
                  <Tabs defaultValue={createdSubsystems[0]?.id.toString()} className="w-full overflow-x-auto">
                    <TabsList className="w-max">
                      {createdSubsystems.map((sub) => (
                        <TabsTrigger key={sub.id} value={sub.id.toString()}>
                          {sub.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {createdSubsystems.map((sub) => (
                      <TabsContent key={sub.id} value={sub.id.toString()}>
                        <div className="space-y-4 p-2 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor={`ip-name-${sub.id}`}>Inspection Point Name</Label>
                            <div className="flex space-x-2">
                              <Input
                                className="bg-muted shadow-none hover:bg-accent"
                                id={`ip-name-${sub.id}`}
                                value={inspectionPointName}
                                onChange={(e) => setInspectionPointName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddInspectionPoint(sub.id);
                                  }
                                }}
                              />
                              <Button type="button" onClick={() => handleAddInspectionPoint(sub.id)}>
                                Add Point
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Added Points for {sub.name}</Label>
                            {(inspectionPoints[sub.id]?.length ?? 0) > 0 ? (
                              <div className="space-y-2 rounded-md bg-muted p-2">
                                {inspectionPoints[sub.id].map((name, index) => (
                                  <div key={index} className="flex items-center justify-between rounded-full bg-primary p-1 text-primary-foreground">
                                    <span className="ml-3">{name}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 p-4 hover:bg-destructive hover:text-destructive-foreground"
                                      onClick={() => handleRemoveInspectionPoint(sub.id, index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="py-4 text-center text-sm text-muted-foreground">No inspection points added yet for this subsystem.</p>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                  {inspectionPointErrors.inspection_points && (
                    <p className="mt-2 text-sm text-red-500">{inspectionPointErrors.inspection_points[0]}</p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create a New Machine</DialogTitle>
          <DialogDescription>Follow the steps to add a new machine and its components to the system.</DialogDescription>
        </DialogHeader>

        {renderStepContent()}

        <DialogFooter>
          <Button
            className="hover:bg-destructive hover:text-destructive-foreground"
            variant="ghost"
            onClick={handleClose}
            disabled={axiosProcessing || processing}
          >
            <CircleX className="h-4 w-4" />
            Cancel
          </Button>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={axiosProcessing}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {step === 1 && (
            <>
              {/* 11. Los dos botones del Paso 1 */}
              <Button type="submit" form="machine-form" variant="outline" onClick={() => setSubmissionType('finish')} disabled={processing}>
                <Send className="h-4 w-4" />
                {processing && submissionType === 'finish' ? 'Saving...' : 'Finish'}{' '}
              </Button>
              <Button type="submit" form="machine-form" onClick={() => setSubmissionType('continue')} disabled={processing}>
                <SendHorizonal className="h-4 w-4" />
                {processing && submissionType === 'continue' ? 'Saving...' : 'Continue'}{' '}
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button onClick={handleSaveSubsystemsAndContinue} disabled={axiosProcessing}>
                <SendHorizonal className="h-4 w-4" />
                {axiosProcessing ? 'Saving...' : 'Save and Continue'}
              </Button>
            </>
          )}
          {step === 3 && (
            <Button onClick={handleSaveInspectionPointsAndFinish} disabled={axiosProcessing}>
              {axiosProcessing ? 'Saving...' : 'Finish'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
