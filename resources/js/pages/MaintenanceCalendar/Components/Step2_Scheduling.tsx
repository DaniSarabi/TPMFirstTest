import { PopoverContentCustom, PopoverCustom, PopoverTriggerCustom } from '@/components/custom/popoverCustom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

interface Props {
  data: any; // Inertia form data
  setData: (key: string, value: any) => void;
  errors: any;
}

export function Step2_Scheduling({ data, setData, errors }: Props) {
  return (
    <div className="grid grid-cols-1 gap-8 py-4 md:grid-cols-2">
      {/* Left Column: Date Picker */}
      <div className="space-y-2">
        <div className="">
          <Label>Event Title</Label>
          <Input
            className="ring ring-ring hover:bg-accent hover:text-accent-foreground"
            type="text"
            value={data.title}
            onChange={(e) => setData('title', e.target.value)}
            placeholder="e.g., Monthly Inspection for Pump A"
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        <Label>Select Scheduled Date</Label>
        <div className="flex justify-center rounded-md border border-ring">
          <Calendar mode="single" selected={data.scheduled_date} onSelect={(date) => date && setData('scheduled_date', date)} />
        </div>
        {errors.scheduled_date && <p className="text-sm text-destructive">{errors.scheduled_date}</p>}
      </div>

      {/* Right Column: Repeating & Notification Fields */}
      <div className="space-y-4 pt-6">
        <div className="space-y-4 rounded-md border border-ring p-4 shadow-lg drop-shadow-md">
          <div className="flex items-center space-x-2">
            <Checkbox id="is_repeating" checked={data.is_repeating} onCheckedChange={(checked) => setData('is_repeating', Boolean(checked))} />
            <Label htmlFor="is_repeating">Repeat this maintenance</Label>
          </div>
          {data.is_repeating && (
            <div className="grid grid-cols-2 grid-rows-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Repeat every</Label>
                <Input
                  className="hover:text-accent-foraeground hover:bg-accent"
                  type="number"
                  value={data.repeat_interval}
                  onChange={(e) => setData('repeat_interval', parseInt(e.target.value, 10))}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={data.repeat_unit} onValueChange={(value) => setData('repeat_unit', value)}>
                  <SelectTrigger className="hover:bg-accent hover:text-accent-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="hover:bg-accent hover:text-accent-foreground" value="days">
                      Days
                    </SelectItem>
                    <SelectItem className="hover:bg-accent hover:text-accent-foreground" value="weeks">
                      Weeks
                    </SelectItem>
                    <SelectItem className="hover:bg-accent hover:text-accent-foreground" value="months">
                      Months
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Repeat until</Label>
                <PopoverCustom>
                  <PopoverTriggerCustom asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(data.repeat_until, 'PPP')}
                    </Button>
                  </PopoverTriggerCustom>
                  <PopoverContentCustom className="w-auto p-0 ">
                    <Calendar mode="single" selected={data.repeat_until} onSelect={(date) => date && setData('repeat_until', date)} />
                  </PopoverContentCustom>
                </PopoverCustom>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Event Color</Label>
          <PopoverCustom>
            <PopoverTriggerCustom asChild className="border-ring hover:bg-accent hover:text-accent-foreground">
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <div className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full border" style={{ backgroundColor: data.color || '#6b7280' }} />
                  {data.color || 'Select a color'}
                </div>
              </Button>
            </PopoverTriggerCustom>
            <PopoverContentCustom className="w-auto p-0">
              <HexColorPicker color={data.color || '#6b7280'} onChange={(color) => setData('color', color)} />
            </PopoverContentCustom>
          </PopoverCustom>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Grace Period (days)</Label>
            <Input
              className="ring ring-ring hover:bg-accent hover:text-accent-foreground"
              type="number"
              value={data.grace_period_days}
              onChange={(e) => setData('grace_period_days', parseInt(e.target.value, 10))}
            />
            {errors.grace_period_days && <p className="text-sm text-destructive">{errors.grace_period_days}</p>}
          </div>
          <div className="space-y-2">
            <Label>Reminder (days before)</Label>
            <Input
              className="ring ring-ring hover:bg-accent hover:text-accent-foreground"
              type="number"
              placeholder="Optional"
              value={data.reminder_days_before ?? ''}
              onChange={(e) => setData('reminder_days_before', e.target.value ? parseInt(e.target.value, 10) : null)}
            />
            {errors.reminder_days_before && <p className="text-sm text-destructive">{errors.reminder_days_before}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
