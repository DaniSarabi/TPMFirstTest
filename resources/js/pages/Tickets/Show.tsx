import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as React from 'react';
import { Ticket } from './Columns';
import { KeyInfoCard } from './Components/KeyInfoCard';
import { FullDetailsCard } from './Components/FullDetailsCard';
import { DiscussionCard } from './Components/DiscussionCard';
import { ActivityLogCard } from './Components/ActivityLogCard';

// --- Type Definitions for this page ---
// These should match the data sent from your TicketController@show method

interface ShowPageProps {
    ticket: Ticket;
}

export default function Show({ ticket }: ShowPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Tickets',
            href: route('tickets.index'),
        },
        {
            title: `Ticket #${ticket.id}`,
            href: route('tickets.show', ticket.id),
            isCurrent: true,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Ticket #${ticket.id}`} />

            <div className="p-6">
                {/* --- Main Two-Column Grid Layout --- */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    
                    {/* --- Left Column (Main Details) --- */}
                    <div className="lg:col-span-2 space-y-6">
                        <KeyInfoCard ticket={ticket} />
                        <FullDetailsCard ticket={ticket} />
                        <Card>
                            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                            <CardContent><p>Actions Card...</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Parts Log</CardTitle></CardHeader>
                            <CardContent><p>Parts Log Card...</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Related Tickets</CardTitle></CardHeader>
                            <CardContent><p>Related Tickets Card...</p></CardContent>
                        </Card>
                    </div>

                    {/* --- Right Column (History & Discussion) --- */}
                    <div className="lg:col-span-1 space-y-6">
                        <DiscussionCard ticket={ticket} />
                        <ActivityLogCard ticket={ticket} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
