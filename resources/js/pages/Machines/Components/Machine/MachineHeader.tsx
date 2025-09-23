import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MachineHealthChart } from '@/components/ui/MachineHealthChart';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DynamicLucideIcon from '@/components/dynamicIconHelper';
import { getContrastColor, getStatusBadgeClass } from '@/lib/tpm-helpers';
import { Machine } from '@/types/machine';
import { Activity, Calendar, Clock, History, ListChecks, Pencil, QrCode, Ticket, Trash2, Wrench } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils'; // ACTION: Se importa 'cn' para manejar clases condicionales

// Componente de estadística reutilizable (sin cambios)
const StatCard = ({ icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null }) => (
    <div className="flex items-center gap-3">
        {React.createElement(icon, { className: 'h-8 w-8 text-primary-foreground/80' })}
        <div>
            <p className="text-sm font-medium text-primary-foreground/80">{label}</p>
            <p className="text-lg font-bold">{value ?? 'N/A'}</p>
        </div>
    </div>
);

interface HealthStats {
    health_score: number;
    total_items: number;
    ok_count: number;
    warning_count: number;
    critical_count: number;
}
interface Props {
    machine: Machine;
    stats: any;
    uptime: any;
    healthScores: {
        today: HealthStats;
        week: HealthStats;
        month: HealthStats;
    };
    onEdit: () => void;
    onDelete: () => void;
    onQrCode: () => void;
    can: { edit: boolean; delete: boolean };
}

export function MachineHeader({ machine, stats, uptime, healthScores, onEdit, onDelete, onQrCode, can }: Props) {
    const [selectedPeriod, setSelectedPeriod] = React.useState<'today' | 'week' | 'month'>('today');

    return (
        <Card className="border-0 bg-primary p-0 text-primary-foreground shadow-lg drop-shadow-lg">
            <div className="flex flex-col md:flex-row">
                {/* Columna Izquierda: Detalles y Estadísticas */}
                <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                            <div className="rounded-full bg-background p-1">
                                <Badge className={`text-base capitalize ${getStatusBadgeClass(machine.status)}`}>{machine.status.replace(/_/g, ' ')}</Badge>{' '}
                            </div>
                            {machine.tags && machine.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {machine.tags.map((tag) => (
                                        <div key={tag.id} className="rounded-full bg-background px-0.5 py-0.5">
                                            <Badge
                                                className="flex items-center gap-1.5 text-xs"
                                                style={{
                                                    backgroundColor: tag.color,
                                                    color: getContrastColor(tag.color),
                                                }}
                                            >
                                                <DynamicLucideIcon name={tag.icon} className="h-3 w-3 stroke-3" />
                                                <span className="capitalize">{tag.name}</span>
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="secondary" size="icon">
                                        <Activity className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                {/* ACTION: Se aplican los estilos de blur y fondo semitransparente */}
                                <PopoverContent className="w-auto border-border/50 bg-background/80 p-2 backdrop-blur-sm">
                                    {/* ACTION: Se reemplazan los Tabs por un grupo de botones */}
                                    <div className="mb-2 flex w-full justify-around rounded-md bg-muted/50 p-1">
                                        {(['today', 'week', 'month'] as const).map((period) => (
                                            <Button
                                                key={period}
                                                variant={selectedPeriod === period ? 'secondary' : 'ghost'}
                                                className={cn('h-8 flex-1 capitalize', {
                                                    'shadow-sm': selectedPeriod === period,
                                                })}
                                                onClick={() => setSelectedPeriod(period)}
                                            >
                                                {period}
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="p-2">
                                        {healthScores && healthScores[selectedPeriod] ? (
                                            <MachineHealthChart
                                                stats={healthScores[selectedPeriod]}
                                                period={(selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)) as any}
                                            />
                                        ) : (
                                            <div className="flex h-[300px] w-[280px] items-center justify-center">
                                                <p className="text-center text-muted-foreground">No data available.</p>
                                            </div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Button variant="secondary" size="icon" onClick={onQrCode}>
                                <QrCode className="h-4 w-4" />
                            </Button>
                            {can.edit && (
                                <Button variant="outline" size="icon" onClick={onEdit}>
                                    <Pencil className="h-4 w-4 text-primary" />
                                </Button>
                            )}
                            {can.delete && (
                                <Button variant="destructive" size="icon" onClick={onDelete}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <h1 className="my-2 text-3xl font-bold">{machine.name}</h1>
                    <p className="mb-6 leading-relaxed text-primary-foreground/80">{machine.description || 'No description provided.'}</p>

                    <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-6 border-t-3 border-primary-foreground pt-6">
                        <StatCard icon={Clock} label="Current Uptime" value={uptime.duration} />
                        <StatCard icon={Ticket} label="Open Tickets" value={stats.open_tickets_count} />
                        <StatCard icon={History} label="Last Inspection" value={stats.last_inspection_date} />
                        <StatCard icon={Calendar} label="Last Maintenance" value={stats.last_maintenance_date} />
                        <StatCard icon={Wrench} label="Subsystems" value={stats.subsystems_count} />
                        <StatCard icon={ListChecks} label="Inspection Points" value={stats.inspection_points_count} />
                    </div>
                </div>

                <div className="flex h-full w-full items-center justify-center p-10 md:w-1/3">
                    <img
                        src={machine.image_url || 'https://placehold.co/500x500/e2e8f0/64748b?text=No+Image'}
                        alt={`Image of ${machine.name}`}
                        className="h-full max-h-80 w-full rounded-xl object-cover"
                    />
                </div>
            </div>
        </Card>
    );
}
