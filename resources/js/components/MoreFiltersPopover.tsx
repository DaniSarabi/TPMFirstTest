import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SlidersHorizontal } from 'lucide-react';
import * as React from 'react';

interface MoreFiltersPopoverProps {
  children: React.ReactNode;
}

export function MoreFiltersPopover({ children }: MoreFiltersPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 border-dashed border-primary">
          <SlidersHorizontal className="mr-2 h-4 w-4" /> More
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-border/50 bg-background/80 p-4 backdrop-blur-sm" align="start">
        {/* ACTION: Se renderizan los filtros que se pasen como hijos */}
        <div className="grid gap-4">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
