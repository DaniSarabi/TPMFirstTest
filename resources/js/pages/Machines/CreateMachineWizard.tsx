import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { X } from 'lucide-react';
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

// Progress Bar Component (remains the same)
const WizardProgressBar = ({ currentStep }: { currentStep: number }) => {
  const steps = ['Machine Details', 'Add Subsystems', 'Add Inspection Points'];
  return (
    <ol className="flex w-full items-center text-center text-sm font-medium text-gray-500 sm:text-base dark:text-gray-400">
      {steps.map((stepName, index) => {
        const stepNumber = index + 1;
        const isCompleted = currentStep > stepNumber;
        const isCurrent = currentStep === stepNumber;
        return (
          <li
            key={stepNumber}
            className={`flex items-center md:w-full ${isCompleted ? 'text-blue-600 dark:text-blue-500' : ''} ${index < steps.length - 1 ? "after:border-1 after:mx-6 after:hidden after:h-1 after:w-full after:border-b after:border-gray-200 sm:after:inline-block sm:after:content-[''] xl:after:mx-10 dark:after:border-gray-700" : ''}`}
          >
            <span
              className={`flex items-center after:mx-2 after:text-gray-200 after:content-['/'] sm:after:hidden dark:after:text-gray-500 ${isCurrent ? 'font-bold' : ''}`}
            >
              {isCompleted ? (
                <svg
                  className="me-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                </svg>
              ) : (
                <span className="me-2">{stepNumber}</span>
              )}
              {stepName}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export function CreateMachineWizard({ isOpen, onOpenChange, onFinish }: CreateMachineWizardProps) {
  const [step, setStep] = React.useState(1);
  const [newMachineId, setNewMachineId] = React.useState<number | null>(null);

  // State for Step 1
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [processing, setProcessing] = React.useState(false);
  const [errors, setErrors] = React.useState<{ name?: string; description?: string; subsystems?: string[]; inspection_points?: string[] }>({});

  // State for Step 2
  const [subsystemName, setSubsystemName] = React.useState('');
  const [subsystems, setSubsystems] = React.useState<string[]>([]);

  // State for Step 3
  const [createdSubsystems, setCreatedSubsystems] = React.useState<CreatedSubsystem[]>([]);
  const [inspectionPointName, setInspectionPointName] = React.useState('');
  const [inspectionPoints, setInspectionPoints] = React.useState<Record<number, string[]>>({});

  const handleSaveMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});
    const payload = { name, description };
    try {
      let response;
      if (newMachineId) {
        response = await axios.put(route('machines.update', newMachineId), payload);
      } else {
        response = await axios.post(route('machines.store'), payload);
      }
      setNewMachineId(response.data.id);
      setStep(2);
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        setErrors(error.response.data.errors);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    } finally {
      setProcessing(false);
    }
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
    setProcessing(true);
    setErrors({});
    try {
      const response = await axios.post(route('subsystems.store', newMachineId), {
        subsystems: subsystems,
      });
      const savedSubsystems = response.data.subsystems as CreatedSubsystem[];

      // --- ACTION 1: Synchronize the state ---
      // Update both the `createdSubsystems` (with IDs) and the `subsystems` (names only)
      // to match exactly what is now in the database.
      setCreatedSubsystems(savedSubsystems);
      setSubsystems(savedSubsystems.map((sub) => sub.name));

      setStep(3);
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        setErrors(error.response.data.errors);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    } finally {
      setProcessing(false);
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
    setProcessing(true);
    setErrors({});
    try {
      await axios.post(route('inspection-points.store'), {
        inspection_points: inspectionPoints,
      });
      // --- ACTION: Move handleClose() inside the try block ---
      // This ensures the modal only closes after a successful API call.
      handleClose();
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        setErrors(error.response.data.errors);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSubsystemName('');
    setSubsystems([]);
    // --- ACTION 2: Reset the createdSubsystems state ---
    // This fixes the bug where old data would persist if the modal was closed and reopened.
    setCreatedSubsystems([]);
    setInspectionPointName('');
    setInspectionPoints({});
    setErrors({});
    setStep(1);
    setNewMachineId(null);
    onOpenChange(false);
    onFinish();
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form id="machine-form" onSubmit={handleSaveMachine} className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Machine Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description[0]}</p>}
            </div>
          </form>
        );
      case 2:
        return (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subsystem-name">Subsystem Name</Label>
              <div className="flex space-x-2">
                <Input
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
              {errors.subsystems && <p className="mt-1 text-sm text-red-500">{errors.subsystems[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label>Added Subsystems</Label>
              {subsystems.length > 0 ? (
                <div className="space-y-2 rounded-md border p-2">
                  {subsystems.map((name, index) => (
                    <div key={index} className="bg-primary flex items-center justify-between rounded p-2 text-white">
                      <span>{name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-500" onClick={() => handleRemoveSubsystem(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-4 text-center text-sm">No subsystems added yet.</p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid gap-4 py-4">
            <Tabs defaultValue={createdSubsystems[0]?.id.toString()} className="w-full overflow-x-auto">
              <TabsList className="x-max">
                {createdSubsystems.map((sub) => (
                  <TabsTrigger key={sub.id} value={sub.id.toString()}>
                    {sub.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {createdSubsystems.map((sub) => (
                <TabsContent key={sub.id} value={sub.id.toString()}>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor={`ip-name-${sub.id}`}>Inspection Point Name</Label>
                      <div className="flex space-x-2">
                        <Input
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
                        <div className="bg-pri space-y-2 rounded-md border p-2">
                          {inspectionPoints[sub.id].map((name, index) => (
                            <div key={index} className="bg-primary flex items-center justify-between rounded p-2 text-white">
                              <span>{name}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-red-500"
                                onClick={() => handleRemoveInspectionPoint(sub.id, index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground py-4 text-center text-sm">No inspection points added yet for this subsystem.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            {errors.inspection_points && <p className="mt-2 text-sm text-red-500">{errors.inspection_points[0]}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create a New Machine</DialogTitle>
          <DialogDescription>Follow the steps to add a new machine and its components to the system.</DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <WizardProgressBar currentStep={step} />
        </div>
        {renderStepContent()}
        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={processing}>
              Back
            </Button>
          )}
          {step === 1 && (
            <Button type="submit" form="machine-form" disabled={processing}>
              {processing ? 'Saving...' : 'Save and Continue'}
            </Button>
          )}
          {step === 2 && (
            <>
              <Button variant="secondary" className="text-white" onClick={handleClose} disabled={processing}>
                Finish
              </Button>
              <Button onClick={handleSaveSubsystemsAndContinue} disabled={processing}>
                {processing ? 'Saving...' : 'Save and Continue'}
              </Button>
            </>
          )}
          {step === 3 && (
            <Button onClick={handleSaveInspectionPointsAndFinish} disabled={processing}>
              {processing ? 'Saving...' : 'Finish'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
