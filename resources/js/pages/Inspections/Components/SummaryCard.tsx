import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Machine } from '@/types/machine';
import { Clock, ClockArrowUp, ListCheck, Wrench } from 'lucide-react'
import React from 'react'


interface SummaryCardProps {
  machine: Machine;
  uptime: {
    since: string | null;
    duration: string | null;
  };
}

export function SummaryCard({ machine, uptime }: SummaryCardProps) {

      const totalInspectionPoints =
    machine.subsystems?.reduce((acc, sub) => {
      return acc + (sub.inspection_points?.length ?? 0);
    }, 0) 

  return (
      <Card className="flex h-fit w-full flex-col space-y-3 p-3 shadow-lg drop-shadow-lg md:h-64 md:flex-row md:space-y-0 md:space-x-5">
          {/* Image */}
          <div className="flex h-full w-full items-center justify-center md:w-1/3">
            <img
              src={machine.image_url || 'https://placehold.co/500x500?text=No+Image'}
              alt={`Image of ${machine.name}`}
              className="h-full max-h-58 w-full rounded-xl object-cover"
            />
          </div>
          {/* Info Content */}
          <CardContent className="flex w-full flex-col justify-between p-3 md:w-2/3">
            {/* Top Row Stats */}
            <div className="item-center flex justify-between">
              <div className="flex items-center gap-1">
                <Wrench className="text-primary" />
                <p className="ml-1 text-xl font-bold text-gray-600">{machine.subsystems.length} subsystems</p>
              </div>

              <div className="flex items-center gap-1">
                <ListCheck className="text-primary" />
                <p className="ml-1 text-xl font-bold text-gray-600">{totalInspectionPoints} inspection points</p>
              </div>

              <Badge className="px-6 py-1 text-sm font-medium">
                <p className="flex items-center gap-2">
                  <ClockArrowUp className="h-4 w-4" />
                  {uptime.duration ? (
                    <>
                      <span>Uptime:</span>
                      {uptime.duration}
                    </>
                  ) : (
                    'Not in service'
                  )}
                </p>
              </Badge>
            </div>

            {/* Title */}
            <CardTitle className="text-xl font-black text-foreground md:text-3xl">{machine.name}</CardTitle>

            {/* Description */}
            <p className="line-clamp-3 text-base text-gray-500 md:text-lg">{machine.description || 'No description provided.'}</p>

            {/* Last Inspected */}
            <p className="flex items-center gap-2 text-xl font-bold">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="ml-2 line-clamp-1 text-sm text-muted-foreground">Last Inspected: N/A</span>
            </p>
          </CardContent>
        </Card>
  )
}

