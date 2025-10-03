import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface DateRangeFilterProps {
  selectedDate: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
}

export function DateRangeFilter({ selectedDate, onDateChange }: DateRangeFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-full justify-start border-dashed border-primary text-left font-normal sm:w-[240px]">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate?.from ? (
            selectedDate.to ? (
              `${new Date(selectedDate.from).toLocaleDateString()} - ${new Date(selectedDate.to).toLocaleDateString()}`
            ) : (
              new Date(selectedDate.from).toLocaleDateString()
            )
          ) : (
            <span>Filter by date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-border/50 bg-background/80 p-0 backdrop-blur-sm" align="start">
        <Calendar initialFocus mode="range" defaultMonth={selectedDate?.from} selected={selectedDate} onSelect={onDateChange} numberOfMonths={2} />
      </PopoverContent>
    </Popover>
  );
}
