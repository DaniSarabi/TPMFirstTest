import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Calendar, CircleX, FileSpreadsheet } from 'lucide-react';
import * as React from 'react';

// Definimos los props que este componente espera
interface MaintenanceHistoryFiltersProps {
  machineId: number;
  filters: {
    view_type?: 'upcoming' | 'history';
    maintenance_year_start?: number;
    maintenance_year_end?: number;
    maintenance_month_start?: number;
    maintenance_month_end?: number;
    maintenance_status?: string;
  };
  options: {
    activeYears: number[];
    statuses: string[];
  };
  onFilterChange: (key: string, value: string | number | null) => void;
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

const STATUS_COLORS: { [key: string]: string } = {
  completed: 'bg-green-500',
  completed_overdue: 'bg-orange-500',
  overdue: 'bg-red-500',
  in_progress: 'bg-blue-500',
  in_progress_overdue: 'bg-yellow-500',
  scheduled: 'bg-cyan-500',
};

export function MaintenanceHistoryFilters({
  machineId,
  filters,
  options,
  onFilterChange,
  onRangeFilterChange,
  onReset,
}: MaintenanceHistoryFiltersProps) {
  const isHistoryView = filters.view_type === 'history';

  const [monthRangeStart, setMonthRangeStart] = React.useState<number | null>(null);
  const [hoveredMonth, setHoveredMonth] = React.useState<number | null>(null);
  const [yearRangeStart, setYearRangeStart] = React.useState<number | null>(null);

  const currentYear = new Date().getFullYear();
  const yearGrid = Array.from({ length: 12 }, (_, i) => currentYear - i);

  const areFiltersApplied = Object.entries(filters).some(([key, value]) => key !== 'view_type' && value != null);
  const downloadYear = filters.maintenance_year_start || new Date().getFullYear();

  const handleMonthClick = (monthValue: number) => {
    if (!monthRangeStart) {
      setMonthRangeStart(monthValue);
      onRangeFilterChange('maintenance_month_start', 'maintenance_month_end', monthValue, monthValue);
    } else if (monthRangeStart === monthValue) {
      setMonthRangeStart(null);
      onRangeFilterChange('maintenance_month_start', 'maintenance_month_end', null, null);
    } else {
      onRangeFilterChange(
        'maintenance_month_start',
        'maintenance_month_end',
        Math.min(monthRangeStart, monthValue),
        Math.max(monthRangeStart, monthValue),
      );
      setMonthRangeStart(null);
    }
  };

  const handleYearClick = (yearValue: number) => {
    if (!options.activeYears.includes(yearValue)) return;
    if (!yearRangeStart) {
      setYearRangeStart(yearValue);
      onRangeFilterChange('maintenance_year_start', 'maintenance_year_end', yearValue, yearValue);
    } else if (yearRangeStart === yearValue) {
      setYearRangeStart(null);
      onRangeFilterChange('maintenance_year_start', 'maintenance_year_end', null, null);
    } else {
      onRangeFilterChange('maintenance_year_start', 'maintenance_year_end', Math.min(yearRangeStart, yearValue), Math.max(yearRangeStart, yearValue));
      setYearRangeStart(null);
    }
  };

  const getMonthRangeText = () => {
    const start = filters.maintenance_month_start;
    const end = filters.maintenance_month_end;
    if (!start) return 'Select Month(s)';
    const startMonth = MONTHS.find((m) => m.value === start)?.label;
    if (!end || start === end) return startMonth;
    const endMonth = MONTHS.find((m) => m.value === end)?.label;
    return `${startMonth} - ${endMonth}`;
  };

  const getYearRangeText = () => {
    const start = filters.maintenance_year_start;
    const end = filters.maintenance_year_end;
    if (!start) return 'Select Year(s)';
    if (!end || start === end) return start;
    return `${start} - ${end}`;
  };

  const getCellProps = (type: 'year' | 'month', value: number) => {
    const start = type === 'year' ? filters.maintenance_year_start : filters.maintenance_month_start;
    const end = type === 'year' ? filters.maintenance_year_end : filters.maintenance_month_end;
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
    <div className="mb-4 space-y-4">
      <div className="flex items-center justify-between">
        <ToggleGroup
          type="single"
          size={'lg'}
          variant={'outline'}
          value={filters.view_type || 'history'}
          onValueChange={(v) => onFilterChange('view_type', v || 'history')}
        >
          <ToggleGroupItem value="upcoming">Upcoming</ToggleGroupItem>
          <ToggleGroupItem value="history">History</ToggleGroupItem>
        </ToggleGroup>

        <a href={route('machines.maintenance-plan.download', { machine: machineId, year: downloadYear })} target="_blank">
          <Button className="bg-green-600 hover:bg-green-700">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Download Yearly Plan
          </Button>
        </a>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Year filter */}
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
        {/* Month filter */}
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

        {/* Status filter */}
        {isHistoryView && (
          <Select value={filters.maintenance_status || ''} onValueChange={(value) => onFilterChange('maintenance_status', value)}>
            <SelectTrigger className="w-full border-1 border-primary md:w-[240px]">
              <SelectValue placeholder="Filter by status..." />
            </SelectTrigger>
            <SelectContent>
              {options.statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {/* ACTION: Added colored circle for visual feedback */}
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', STATUS_COLORS[status] || 'bg-gray-400')} />
                    <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {areFiltersApplied && (
          <Button variant="ghost" className="hover:bg-secondary/10 hover:text-red-500" onClick={onReset}>
            <CircleX className="h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
