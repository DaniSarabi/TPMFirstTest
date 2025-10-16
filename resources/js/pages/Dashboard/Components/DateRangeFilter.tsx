import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { addDays, endOfMonth, format, startOfMonth, subDays, subMonths } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

// Helper para combinar clases, si usas `cn` puedes reemplazarlo
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// La prop principal que el dashboard usará para recibir las fechas
interface DateRangeFilterProps {
  onRangeChange: (range: DateRange) => void;
  className?: string;
}

type Preset = 'today' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'allTime';

export function DateRangeFilter({ onRangeChange, className }: DateRangeFilterProps) {
  // Estado para el preset activo, para el estilo visual
  const [activePreset, setActivePreset] = React.useState<Preset | 'custom'>('last30');

  // Estado para el rango de fechas seleccionado
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  // Efecto que notifica al componente padre (el dashboard) cada vez que el rango cambia
  React.useEffect(() => {
    if (date?.from && date?.to) {
      onRangeChange(date as DateRange);
    }
  }, [date, onRangeChange]);

  const handlePresetClick = (preset: Preset) => {
    setActivePreset(preset);
    const now = new Date();
    let newRange: DateRange | undefined;

    switch (preset) {
      case 'today':
        newRange = { from: now, to: now };
        break;
      case 'last7':
        newRange = { from: subDays(now, 6), to: now };
        break;
      case 'last30':
        newRange = { from: subDays(now, 29), to: now };
        break;
      case 'thisMonth':
        newRange = { from: startOfMonth(now), to: endOfMonth(now) };
        break;
      case 'lastMonth':
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));
        newRange = { from: lastMonthStart, to: lastMonthEnd };
        break;
      case 'allTime':
        // Fechas muy lejanas para simular "todo el tiempo"
        newRange = { from: new Date(2024, 0, 1), to: addDays(now, 1) };
        break;
    }
    setDate(newRange);
  };

  const handleDateSelect = (newDate: DateRange | undefined) => {
    setDate(newDate);
    // Si se selecciona un rango personalizado, ningún preset está "activo"
    setActivePreset('custom');
  };

  const presets: { key: Preset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'last7', label: 'Last 7 Days' },
    { key: 'last30', label: 'Last 30 Days' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'allTime', label: 'All Time' },
  ];

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover >
        <PopoverTrigger asChild>
          <Button id="date" variant={'outline'} className={cn('w-[300px] justify-start text-left font-normal', !date && 'text-muted-foreground')}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-auto p-0 backdrop-blur-md bg-transparent border-0 opacity-85" align="start">
          <div className="flex flex-col space-y-2 border-r p-4">
            <span className="text-sm font-semibold">Quick Select</span>
            {presets.map(({ key, label }) => (
              <Button key={key} variant={activePreset === key ? 'secondary' : 'ghost'} onClick={() => handlePresetClick(key)}>
                {label}
              </Button>
            ))}
          </div>
          <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={handleDateSelect} numberOfMonths={2} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
