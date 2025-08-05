import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { CheckCircle, CircleAlert, CircleX, Clock, Clock3, User } from 'lucide-react';

// --- Type Definitions for this component ---
interface ReportStat {
  ok_count: number;
  warning_count: number;
  critical_count: number;
}

interface Report {
  id: number;
  status: string;
  start_date: string;
  completion_date: string | null;
  badge_text: string;
  user_name: string;
  machine_name: string;
  machine_image_url: string | null; // Add machine_image_url
  stats: ReportStat;
}

interface InspectionCardProps {
  report: Report;
}

export function InspectionCard({ report }: InspectionCardProps) {
  const { badge_text, start_date, completion_date, user_name, machine_name, machine_image_url, stats } = report;

  const totalPoints = stats.ok_count + stats.warning_count + stats.critical_count;

  const statusColor = (() => {
    if (stats.critical_count > 0) {
      return 'bg-orange-600'; // Red if there are any critical issues
    }
    if (stats.warning_count > 0) {
      return 'bg-yellow-500'; // Yellow if there are warnings (and no criticals)
    }
    return 'bg-green-600'; // Green if all points are OK
  })();

  return (
    // ---  Wrap the entire card in a Link component ---
    <Link href={route('inspections.show', report.id)} className="block transform transition-transform duration-300 ease-in-out hover:-translate-y-3">
      <Card className="flex h-full w-full flex-col overflow-hidden rounded-lg border-0 p-0 ring-white hover:bg-accent shadow-md drop-shadow-lg">
        {/* Image */}
        <div>
          <img src={machine_image_url || 'https://placehold.co/600x400?text=no+image'} alt={machine_name} className="h-36 w-full object-cover" />

          <Badge variant="default" className="absolute top-2 left-2 z-10">
            Report #{report.id}
          </Badge>

          {/* Status Bar */}
          <div className={`flex items-center px-4 py-1 ${statusColor}`}>
            <Clock className="h-5 w-5 text-white" />
            <span className="ml-2 font-medium text-white">{badge_text}</span>
          </div>
        </div>

        {/* Content */}
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{machine_name}</CardTitle>
          
        </CardHeader>

        <CardContent className="flex-grow space-y-1 text-sm text-muted-foreground">
          <div className='flex items-center gap-2'>
            <User className="h-5 w-5" />
            <span>{user_name}</span>
          </div>
          
          <div className='flex items-center gap-2'>
            <Clock3 className="h-5 w-5" />
            <span>{start_date}</span>
          </div>

          
          <Separator className="my-2 border-primary border-1" />

          {/* Total */}
          <p className="text-sm font-medium text-gray-800">
            Total Points: <span className="font-semibold">{totalPoints}</span>
          </p>

          {/* Stats */}
          <div className="mt-3 mb-4 flex justify-between text-base font-medium">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* ---  Conditionally apply gray color if count is zero --- */}
                  <div className={cn('flex items-center gap-2', stats.ok_count > 0 ? 'text-green-600' : 'text-muted-foreground')}>
                    <CheckCircle className="h-6 w-6" />
                    {stats.ok_count}
                  </div>
                </TooltipTrigger>
                <TooltipContent>OK Points</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn('flex items-center gap-2', stats.warning_count > 0 ? 'text-yellow-500' : 'text-muted-foreground')}>
                    <CircleAlert className="h-6 w-6" />
                    {stats.warning_count}
                  </div>
                </TooltipTrigger>
                <TooltipContent>Warnings</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn('flex items-center gap-2', stats.critical_count > 0 ? 'text-red-600' : 'text-muted-foreground')}>
                    <CircleX className="h-6 w-6" />
                    {stats.critical_count}
                  </div>
                </TooltipTrigger>
                <TooltipContent>Criticals</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
