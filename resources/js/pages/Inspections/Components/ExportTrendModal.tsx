import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Machine } from '@/types/machine';
import { FileDown } from 'lucide-react';
import * as React from 'react';

interface ExportTrendModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  machines: Machine[];
}

export function ExportTrendModal({ isOpen, onOpenChange, machines }: ExportTrendModalProps) {
  const [selectedMachineId, setSelectedMachineId] = React.useState<string>('');
  
  // Default to the last 7 days for a quick, sensible default UX
  const [startDate, setStartDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = React.useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Reset state when modal opens/closes to keep it clean
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedMachineId('');
    }
  }, [isOpen]);

  const handleExport = () => {
    if (!selectedMachineId || !startDate || !endDate) return;

    // Validate dates on the client side
    if (new Date(startDate) > new Date(endDate)) {
        alert("Start date cannot be after end date.");
        return;
    }

    // Construct the query string
    const params = new URLSearchParams({
      machine_id: selectedMachineId,
      start_date: startDate,
      end_date: endDate,
    });

    // ACTION: Open the download in a new tab. 
    // This allows the browser to handle the PDF stream natively.
    const url = `${route('inspections.export-trend')}?${params.toString()}`;
    window.open(url, '_blank');

    onOpenChange(false);
  };

  const isFormValid = selectedMachineId !== '' && startDate !== '' && endDate !== '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Inspection Trend</DialogTitle>
          <DialogDescription>
            Generate a PDF matrix report to analyze machine health over time.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="machine">Machine <span className="text-red-500">*</span></Label>
            <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
              <SelectTrigger id="machine">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date <span className="text-red-500">*</span></Label>
              <Input 
                id="start_date" 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date <span className="text-red-500">*</span></Label>
              <Input 
                id="end_date" 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                min={startDate} // Basic HTML5 validation to prevent picking an end date before start date
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!isFormValid}>
            <FileDown className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}