import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { X } from 'lucide-react';
import * as React from 'react';

// Define the props for the wizard
interface AddSubsystemWizardProps {
  machineId: number; // We need to know which machine this belongs to
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFinish: () => void; // A function to refresh the page data when done
}

// A simple progress indicator for the two steps
const WizardProgress = ({ currentStep }: { currentStep: number }) => {
  const steps = ['Subsystem Details', 'Add Inspection Points'];
  return (
    <div className="flex justify-center space-x-4 text-sm">
      {steps.map((stepName, index) => {
        const stepNumber = index + 1;
        const isCurrent = currentStep === stepNumber;
        return (
          <span key={stepNumber} className={isCurrent ? 'font-bold text-primary' : 'text-muted-foreground'}>
            {stepNumber}. {stepName}
          </span>
        );
      })}
    </div>
  );
};

export function AddSubsystemWizard({ machineId, isOpen, onOpenChange, onFinish }: AddSubsystemWizardProps) {
  const [step, setStep] = React.useState(1);
  const [newSubsystemId, setNewSubsystemId] = React.useState<number | null>(null);
  const [processing, setProcessing] = React.useState(false);

  // State for Step 1
  const [subsystemName, setSubsystemName] = React.useState('');
  const [subsystemErrors, setSubsystemErrors] = React.useState<{ name?: string[] }>({});

  // State for Step 2
  const [inspectionPointName, setInspectionPointName] = React.useState('');
  const [inspectionPoints, setInspectionPoints] = React.useState<string[]>([]);
  const [inspectionPointErrors, setInspectionPointErrors] = React.useState<{ inspection_points?: string[] }>({});

  const handleSaveSubsystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setSubsystemErrors({});
    try {
      let response;
      const payload = { name: subsystemName };

      // If we already have a subsystem ID, we UPDATE (PUT) it.
      if (newSubsystemId) {
        response = await axios.put(route('subsystems.update', newSubsystemId), payload);
      } else {
        // Otherwise, we CREATE (POST) a new one.
        response = await axios.post(route('subsystems.add', machineId), payload);
      }

      // Save the ID from the response.
      setNewSubsystemId(response.data.id);
      setStep(2);
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        setSubsystemErrors(error.response.data.errors);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    } finally {
      setProcessing(false);
    }
  };

  // --- Functions to manage inspection points in Step 2 ---
  const handleAddInspectionPoint = () => {
    if (inspectionPointName.trim() !== '' && !inspectionPoints.includes(inspectionPointName.trim())) {
      setInspectionPoints([...inspectionPoints, inspectionPointName.trim()]);
      setInspectionPointName('');
    }
  };

  const handleRemoveInspectionPoint = (indexToRemove: number) => {
    setInspectionPoints(inspectionPoints.filter((_, index) => index !== indexToRemove));
  };

  // --- Step 2: Save the inspection points and finish ---
  const handleSaveInspectionPointsAndFinish = async () => {
    if (!newSubsystemId) return;
    setProcessing(true);
    setInspectionPointErrors({});
    try {
      await axios.post(route('inspection-points.store'), {
        inspection_points: {
          [newSubsystemId]: inspectionPoints,
        },
      });
      handleClose();
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        setInspectionPointErrors(error.response.data.errors);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    } finally {
      setProcessing(false);
    }
  };

  // --- Reset all state when the modal closes ---
  const handleClose = () => {
    setSubsystemName('');
    setInspectionPoints([]);
    setInspectionPointName('');
    setSubsystemErrors({});
    setInspectionPointErrors({});
    setStep(1);
    setNewSubsystemId(null);
    onOpenChange(false);
    onFinish();
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form id="subsystem-form" onSubmit={handleSaveSubsystem} className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subsystem-name">Subsystem Name</Label>
              <Input
                className="bg-gray-100"
                id="subsystem-name"
                value={subsystemName}
                onChange={(e) => setSubsystemName(e.target.value)}
                required
                autoFocus
              />
              {subsystemErrors.name && <p className="mt-1 text-sm text-red-500">{subsystemErrors.name[0]}</p>}
            </div>
          </form>
        );
      case 2:
        return (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inspection-point-name">Inspection Point Name</Label>
              <div className="flex space-x-2">
                <Input
                                className="bg-gray-100"

                  id="inspection-point-name"
                  value={inspectionPointName}
                  onChange={(e) => setInspectionPointName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInspectionPoint();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddInspectionPoint}>
                  Add
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Added Points</Label>
              {inspectionPoints.length > 0 ? (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-sm border p-2">
                  {inspectionPoints.map((name, index) => (
                    <div key={index} className="flex items-center justify-between rounded-sm bg-primary p-2 text-primary-foreground">
                      <span>{name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveInspectionPoint(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No inspection points added yet.</p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Subsystem</DialogTitle>
          <DialogDescription>Follow the steps to add a new subsystem and its inspection points.</DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <WizardProgress currentStep={step} />
        </div>
        {renderStepContent()}
        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={processing}>
              Back
            </Button>
          )}
          {step === 1 && (
            <Button type="submit" form="subsystem-form" disabled={processing}>
              {processing ? 'Saving...' : 'Save and Continue'}
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleSaveInspectionPointsAndFinish} disabled={processing}>
              {processing ? 'Saving...' : 'Finish'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
