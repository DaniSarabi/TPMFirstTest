import React from 'react';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Machine } from '@/types/machine';
import { MaintenanceTemplate } from '@/types/maintenance';

interface Props {
    data: any;
    setData: (key: string, value: any) => void;
    errors: any;
    machines: Machine[];
    groupedTemplates: Record<string, MaintenanceTemplate[]>;
    selectedMachineId: string | null;
    isFullMachine: boolean;
    // --- New, more specific event handlers ---
    onMachineChange: (machineId: string) => void;
    onFullMachineChange: (checked: boolean) => void;
    onSubsystemChange: (subsystemId: string) => void;
}

export function Step1_Selection({
    data,
    setData,
    errors,
    machines,
    groupedTemplates,
    selectedMachineId,
    isFullMachine,
    onMachineChange,
    onFullMachineChange,
    onSubsystemChange,
}: Props) {
    const selectedMachine = machines.find((m) => m.id === Number(selectedMachineId));

    return (
        <div className="grid grid-cols-1 gap-8 py-4 md:grid-cols-2">
            {/* Left Column: Target Selection */}
            <div className="flex flex-col space-y-4">
                <div className="space-y-2">
                    <Label>1. Select Target Machine</Label>
                    <Select value={selectedMachineId || ''} onValueChange={onMachineChange}>
                        <SelectTrigger className="ring-1 ring-ring hover:bg-accent">
                            <SelectValue placeholder="Select a machine..." />
                        </SelectTrigger>
                        <SelectContent>
                            {machines.map((machine) => (
                                <SelectItem className="hover:bg-accent hover:text-accent-foreground" key={machine.id} value={String(machine.id)}>
                                    {machine.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedMachineId && (
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="full-machine" checked={isFullMachine} onCheckedChange={(checked) => onFullMachineChange(Boolean(checked))} />
                                <Label htmlFor="full-machine">Schedule for the entire machine</Label>
                            </div>

                            {!isFullMachine && (
                                <div className="space-y-2 pl-2">
                                    <Label>Select Subsystem</Label>
                                    <Select onValueChange={onSubsystemChange}>
                                        <SelectTrigger className="ring-1 ring-ring hover:bg-accent">
                                            <SelectValue placeholder="Select a subsystem..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedMachine?.subsystems.map((subsystem) => (
                                                <SelectItem className="hover:bg-accent hover:text-accent-foreground" key={subsystem.id} value={String(subsystem.id)}>
                                                    {subsystem.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}
                    {errors.schedulable_id && <p className="text-sm text-destructive">{errors.schedulable_id}</p>}
                </div>
            </div>

            {/* Right Column: Template Selection */}
            <div className="flex flex-grow flex-col space-y-2">
                <Label>2. Select Maintenance Template</Label>
                <ScrollArea className="h-full flex-grow rounded-md border border-ring">
                    <RadioGroup
                        value={data.maintenance_template_id}
                        onValueChange={(value) => setData('maintenance_template_id', value)}
                        className="p-4"
                    >
                        {Object.entries(groupedTemplates).map(([category, templatesInCategory]) => (
                            <div key={category} className="mb-2">
                                <Label className="font-semibold">{category}</Label>
                                <div className="mt-1 space-y-1 pl-2">
                                    {templatesInCategory.map((template) => (
                                        <div key={template.id} className="flex items-center space-x-2">
                                            <RadioGroupItem value={String(template.id)} id={`template-${template.id}`} />
                                            <Label htmlFor={`template-${template.id}`}>{template.name}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </RadioGroup>
                </ScrollArea>
                {errors.maintenance_template_id && <p className="text-sm text-destructive">{errors.maintenance_template_id}</p>}
            </div>
        </div>
    );
}
