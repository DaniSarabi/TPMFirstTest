import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { ScheduledMaintenance } from '@/types/maintenance';
import { Head, router } from '@inertiajs/react';
import * as React from 'react';
import { MaintenanceChecklist } from './Components/CheckList';
import { StartScreen } from './Components/StartScreen';
import { Machine } from '@/types/machine';

// Define the shape of the props for this page
interface ShowPageProps extends PageProps {
    scheduledMaintenance: ScheduledMaintenance;
    can: {
        perform: boolean;
    };
}

// --- MAIN PAGE COMPONENT ---
export default function Show(props: ShowPageProps) {
    const { scheduledMaintenance } = props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Maintenance Calendar', href: route('maintenance-calendar.index') },
        { title: 'Perform Task', href: '#', isCurrent: true },
    ];

    const handleStart = (logDowntime: boolean) => {
        router.post(route('maintenance.perform.start', scheduledMaintenance.id), {
            log_downtime: logDowntime,
        }, {
            preserveScroll: true,
        });
    };
    
    // The maintenance is considered "not started" only if the status is 'scheduled'.
    const hasNotStarted = scheduledMaintenance.status === 'scheduled';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Perform: ${scheduledMaintenance.title}`} />
            <div className="p-6 space-y-6">
                 {/* Page Header */}
                 <div>
                    <h1 className="text-2xl font-bold tracking-tight">{scheduledMaintenance.title}</h1>
                    {/* <p className="text-muted-foreground">
                        For Machine: {scheduledMaintenance.schedulable.machine?.name   || scheduledMaintenance.schedulable.name}
                        {scheduledMaintenance.schedulable_type === 'App\\Models\\Subsystem' && ` > ${scheduledMaintenance.schedulable.name}`}
                    </p> */}
                </div>

                {hasNotStarted 
                    ? <StartScreen maintenance={scheduledMaintenance} onStart={handleStart} /> 
                    : <MaintenanceChecklist {...props} />
                }
            </div>
        </AppLayout>
    );
}

