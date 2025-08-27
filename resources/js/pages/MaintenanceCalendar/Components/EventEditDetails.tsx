import { PopoverContentCustom, PopoverCustom, PopoverTriggerCustom } from '@/components/custom/popoverCustom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ScheduledMaintenanceEvent } from '@/types/maintenance';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

interface Props {
  data: any;
  setData: (key: string, value: any) => void;
  event: ScheduledMaintenanceEvent;
}

export function EventEditDetails({ data, setData, event }: Props) {
  return (
    <div className="space-y-4 py-4">
      <Separator className="border-1 border-primary bg-primary" />

      <div className="space-y-2">
        <Label>Scheduled Date</Label>
        <PopoverCustom>
          <PopoverTriggerCustom className='ring ring-ring' asChild>
            <Button variant="outline" className={cn('w-full justify-start text-left font-normal')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(data.scheduled_date, 'PPP')}
            </Button>
          </PopoverTriggerCustom>
          <PopoverContentCustom className="w-auto p-0">
            <Calendar mode="single" selected={data.scheduled_date} onSelect={(date) => date && setData('scheduled_date', date)} />
          </PopoverContentCustom>
        </PopoverCustom>
      </div>
      <div className="space-y-2 ">
        <Label>Event Color</Label>
        <PopoverCustom>
          <PopoverTriggerCustom className='ring ring-ring' asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <div className="flex items-center">
                <div className="mr-2 h-5 w-5 rounded-full border" style={{ backgroundColor: data.color }} />
                {data.color}
              </div>
            </Button>
          </PopoverTriggerCustom>
          <PopoverContentCustom className="w-auto p-0">
            <HexColorPicker color={data.color} onChange={(color) => setData('color', color)} />
          </PopoverContentCustom>
        </PopoverCustom>
      </div>
      {event.extendedProps.series_id && (
        <div className="ring ring-ring space-y-2 rounded-md border p-4">
          <Label>Update Options</Label>
          <RadioGroup value={data.update_scope} onValueChange={(value) => setData('update_scope', value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="update-single" />
              <Label htmlFor="update-single">Update this event only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="future" id="update-future" />
              <Label htmlFor="update-future">Update this and all future events</Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
