import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TicketStatus } from '@/types/ticket';
import { Calendar, CircleX } from 'lucide-react';
import * as React from 'react';

// Definimos los props
interface TicketHistoryFiltersProps {
  filters: any;
  options: {
    statuses: TicketStatus[];
    priorities: { id: number; name: string }[];
    categories: string[];
    activeYears: number[];
  };
  onFilterChange: (key: string, value: any) => void;
  onRangeFilterChange: (startKey: string, endKey: string, startValue: number | null, endValue: number | null) => void;
  onReset: () => void;
}

const MONTHS = [
  { value: 1, label: 'Ene' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dic' },
];

export function TicketHistoryFilters({ filters, options, onFilterChange, onRangeFilterChange, onReset }: TicketHistoryFiltersProps) {
  const areFiltersApplied = Object.values(filters).some((v) => v != null && (!Array.isArray(v) || v.length > 0));
  const [yearRangeStart, setYearRangeStart] = React.useState<number | null>(null);
  const [monthRangeStart, setMonthRangeStart] = React.useState<number | null>(null);
  const [hoveredMonth, setHoveredMonth] = React.useState<number | null>(null);
  const currentYear = new Date().getFullYear();
  const yearGrid = Array.from({ length: 12 }, (_, i) => currentYear - i);

  const handleMonthClick = (monthValue: number) => {
    if (!monthRangeStart) {
      setMonthRangeStart(monthValue);
      onRangeFilterChange('ticket_month_start', 'ticket_month_end', monthValue, monthValue);
    } else if (monthRangeStart === monthValue) {
      setMonthRangeStart(null);
      onRangeFilterChange('ticket_month_start', 'ticket_month_end', null, null);
    } else {
      onRangeFilterChange('ticket_month_start', 'ticket_month_end', Math.min(monthRangeStart, monthValue), Math.max(monthRangeStart, monthValue));
      setMonthRangeStart(null);
    }
  };

  const handleYearClick = (yearValue: number) => {
    if (!options.activeYears.includes(yearValue)) return;
    if (!yearRangeStart) {
      setYearRangeStart(yearValue);
      onRangeFilterChange('ticket_year_start', 'ticket_year_end', yearValue, yearValue);
    } else if (yearRangeStart === yearValue) {
      setYearRangeStart(null);
      onRangeFilterChange('ticket_year_start', 'ticket_year_end', null, null);
    } else {
      onRangeFilterChange('ticket_year_start', 'ticket_year_end', Math.min(yearRangeStart, yearValue), Math.max(yearRangeStart, yearValue));
      setYearRangeStart(null);
    }
  };

  const getMonthRangeText = () => {
    const start = filters.ticket_month_start;
    const end = filters.ticket_month_end;
    if (!start) return 'Select Month(s)';
    const startMonth = MONTHS.find((m) => m.value === start)?.label;
    if (!end || start === end) return startMonth;
    const endMonth = MONTHS.find((m) => m.value === end)?.label;
    return `${startMonth} - ${endMonth}`;
  };

  const getYearRangeText = () => {
    const start = filters.ticket_year_start;
    const end = filters.ticket_year_end;
    if (!start) return 'Select Year(s)';
    if (!end || start === end) return start;
    return `${start} - ${end}`;
  };

  const getCellProps = (type: 'year' | 'month', value: number) => {
    const start = type === 'year' ? filters.ticket_year_start : filters.ticket_month_start;
    const end = type === 'year' ? filters.ticket_year_end : filters.ticket_month_end;
    const rangeStart = type === 'year' ? yearRangeStart : monthRangeStart;
    const hovered = type === 'year' ? null : hoveredMonth;

    let inRange = false;
    let isStart = false;
    let isEnd = false;

    const checkRange = (s: number, e: number) => {
      const min = Math.min(s, e);
      const max = Math.max(s, e);
      if (value > min && value < max) inRange = true;
      if (value === min) isStart = true;
      if (value === max) isEnd = true;
    };

    if (start && end) checkRange(start, end);
    if (rangeStart && hovered) checkRange(rangeStart, hovered);

    return { inRange, isStart, isEnd };
  };

  return (
    <div className="space-y-4 rounded-lg text-card-foreground  mb-4">
      <div className="flex flex-wrap items-center gap-4">
        <Popover onOpenChange={(open) => !open && setYearRangeStart(null)}>
          <PopoverTrigger className="border-1 border-primary" asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal md:w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <span>{getYearRangeText()}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-4">
              {yearGrid.map((year) => {
                const { inRange, isStart, isEnd } = getCellProps('year', year);
                return (
                  <div
                    key={year}
                    className={cn('p-0', (inRange || isStart || isEnd) && 'bg-secondary', isStart && 'rounded-l-md', isEnd && 'rounded-r-md')}
                  >
                    <Button
                      variant={isStart || isEnd ? 'default' : 'ghost'}
                      className={cn('w-full', inRange && 'text-secondary-foreground')}
                      disabled={!options.activeYears.includes(year)}
                      onClick={() => handleYearClick(year)}
                    >
                      {year}
                    </Button>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        <Popover
          onOpenChange={(open) => {
            if (!open) {
              setMonthRangeStart(null);
              setHoveredMonth(null);
            }
          }}
        >
          <PopoverTrigger className="border-1 border-primary" asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal md:w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <span>{getMonthRangeText()}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-4">
              {MONTHS.map((month) => {
                const { inRange, isStart, isEnd } = getCellProps('month', month.value);
                return (
                  <div
                    key={month.value}
                    className={cn('p-0', (inRange || isStart || isEnd) && 'bg-secondary/15', isStart && 'rounded-l-md', isEnd && 'rounded-r-md')}
                    onMouseEnter={() => monthRangeStart && setHoveredMonth(month.value)}
                    onMouseLeave={() => monthRangeStart && setHoveredMonth(null)}
                  >
                    <Button
                      variant={isStart || isEnd ? 'default' : 'ghost'}
                      className={cn('w-full', inRange)}
                      onClick={() => handleMonthClick(month.value)}
                    >
                      {month.label}
                    </Button>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        <MultiSelectFilter
          title="Status"
          options={options.statuses}
          selectedValues={new Set(filters.ticket_statuses)}
          onSelectedValuesChange={(values) => onFilterChange('ticket_statuses', Array.from(values))}
        />
        <MultiSelectFilter
          title="Priority"
          options={options.priorities}
          selectedValues={new Set(filters.ticket_priorities)}
          onSelectedValuesChange={(values) => onFilterChange('ticket_priorities', Array.from(values))}
        />
        <MultiSelectFilter
          title="Category"
          options={options.categories.map((c) => ({ id: c, name: c }))}
          selectedValues={new Set(filters.ticket_categories)}
          onSelectedValuesChange={(values) => onFilterChange('ticket_categories', Array.from(values))}
        />
        {areFiltersApplied && (
          <Button variant="ghost" onClick={onReset} className="h-9 hover:text-destructive">
            <CircleX className="mr-2 h-4 w-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
