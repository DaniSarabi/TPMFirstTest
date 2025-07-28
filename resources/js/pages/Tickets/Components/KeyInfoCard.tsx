import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket } from '../Columns';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldAlert, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyInfoCardProps {
    ticket: Ticket;
}

export function KeyInfoCard({ ticket }: KeyInfoCardProps) {
    // Helper to determine the priority icon and color
    const PriorityDisplay = () => {
        if (ticket.priority === 2) {
            return <div className="flex items-center gap-2 text-red-600"><ShieldAlert className="h-5 w-5" /> High</div>;
        }
        if (ticket.priority === 1) {
            return <div className="flex items-center gap-2 text-yellow-600"><AlertTriangle className="h-5 w-5" /> Medium</div>;
        }
        return <span className="text-muted-foreground">Low</span>;
    };
    
    const timeOpen = new Date(ticket.created_at).toLocaleString(); // Simple format for now

    return (
        <Card className='drop-shadow-lg shadow-lg'>
            <CardHeader>
                <CardTitle>Key Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge style={{ backgroundColor: ticket.status.bg_color, color: ticket.status.text_color }}>
                        {ticket.status.name}
                    </Badge>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Priority</span>
                    <span className="font-semibold"><PriorityDisplay /></span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created By</span>
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{ticket.creator.name}</span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time Open</span>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{timeOpen}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
