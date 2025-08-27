import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import { MaintenanceTemplate } from '@/types/maintenance';
import { Machine } from '@/types/machine';
import { ArrowRight, CalendarCheck } from 'lucide-react';
import { Step1_Selection } from './Step1_Selection';
import { Step2_Scheduling } from './Step2_Scheduling';
import { Progress } from '@/components/ui/progress';

interface Props {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    machines: Machine[];
    templates: MaintenanceTemplate[];
}

export function ScheduleMaintenanceModal({ isOpen, onOpenChange, machines, templates }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        maintenance_template_id: '' as string | null,
        scheduled_date: new Date(),
        grace_period_days: 7,
        reminder_days_before: 3 as number | null,
        schedulable_type: '',
        schedulable_id: null as number | null,
        is_repeating: false,
        repeat_interval: 1,
        repeat_unit: 'months',
        repeat_until: new Date(),
        // FIX: Initialize the title and color fields to prevent the uncontrolled input error.
        title: '',
        color: null as string | null,
    });

    const [step, setStep] = useState(1);
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [isFullMachine, setIsFullMachine] = useState(true);

    const groupedTemplates = useMemo(() => {
        return templates.reduce(
            (acc, template) => {
                const category = template.category || 'Uncategorized';
                if (!acc[category]) acc[category] = [];
                acc[category].push(template);
                return acc;
            },
            {} as Record<string, MaintenanceTemplate[]>,
        );
    }, [templates]);

    // Auto-populate the title when a target and template are selected
    useEffect(() => {
        const machine = machines.find(m => m.id === Number(selectedMachineId));
        const template = templates.find(t => t.id === Number(data.maintenance_template_id));

        if (machine && template) {
            const targetName = isFullMachine ? machine.name : 'Subsystem'; // Simplified for now
            setData('title', `${template.name} for ${targetName}`);
        }
    }, [selectedMachineId, data.maintenance_template_id, isFullMachine]);


    useEffect(() => {
        if (!selectedMachineId) {
            setData({ ...data, schedulable_type: '', schedulable_id: null });
            return;
        }
        if (isFullMachine) {
            setData({ ...data, schedulable_type: 'machine', schedulable_id: Number(selectedMachineId) });
        } else {
            setData({ ...data, schedulable_type: '', schedulable_id: null });
        }
    }, [selectedMachineId, isFullMachine]);

    useEffect(() => {
        if (!isOpen) {
            reset();
            setSelectedMachineId(null);
            setIsFullMachine(true);
            setStep(1);
        }
    }, [isOpen]);

    const handleMachineChange = (machineId: string) => {
        setSelectedMachineId(machineId);
        setIsFullMachine(true);
        setData({
            ...data,
            schedulable_type: 'machine',
            schedulable_id: Number(machineId),
        });
    };

    const handleFullMachineChange = (checked: boolean) => {
        setIsFullMachine(checked);
        if (checked) {
            setData({
                ...data,
                schedulable_type: 'machine',
                schedulable_id: Number(selectedMachineId),
            });
        } else {
            // Clear the selection to force a subsystem choice
            setData({ ...data, schedulable_type: '', schedulable_id: null });
        }
    };

    const handleSubsystemChange = (subsystemId: string) => {
        setData({
            ...data,
            schedulable_type: 'subsystem',
            schedulable_id: Number(subsystemId),
        });
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('scheduled-maintenances.store'), {
            onSuccess: () => onOpenChange(false),
        });
    };

    const canProceedToStep2 = data.schedulable_id && data.maintenance_template_id;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl min-w-3xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Schedule New Maintenance</DialogTitle>
                        <DialogDescription>
                            {step === 1
                                ? 'First, select a target and a maintenance template.'
                                : 'Now, set the date and scheduling options.'}
                        </DialogDescription>
                        <div className="pt-2">
                            <Progress value={step === 1 ? 50 : 100} className="w-full" />
                        </div>
                    </DialogHeader>

                    {step === 1 && (
                         <Step1_Selection
                            data={data}
                            setData={setData}
                            errors={errors}
                            machines={machines}
                            groupedTemplates={groupedTemplates}
                            selectedMachineId={selectedMachineId}
                            isFullMachine={isFullMachine}
                            onMachineChange={handleMachineChange}
                            onFullMachineChange={handleFullMachineChange}
                            onSubsystemChange={handleSubsystemChange}
                        />
                    )}

                    {step === 2 && <Step2_Scheduling data={data} setData={setData} errors={errors} />}

                    <DialogFooter>
                        {step === 1 && (
                            <Button type="button" onClick={() => setStep(2)} disabled={!canProceedToStep2}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                        {step === 2 && (
                            <>
                                <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <CalendarCheck className="mr-2 h-4 w-4" />
                                    {processing ? 'Scheduling...' : 'Schedule Event'}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
