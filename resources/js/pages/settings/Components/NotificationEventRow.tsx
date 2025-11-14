import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AtSign, Bell, Lock, Mail, Settings2 } from 'lucide-react';
import * as React from 'react';
import { Channel, GroupedNotification } from '../notifications';

interface NotificationEventRowProps {
  group: GroupedNotification;
  isLocked: (type: string) => boolean;
  isGlobalOn: (eventKey: string, channel: Channel) => boolean;
  getMachineExceptions: (eventKey: string, channel: Channel) => Set<number>;
  onMasterSwitchChange: (eventKey: string, channel: Channel, checked: boolean) => void;
  onManageExceptions: (eventKey: string, channel: Channel) => void;
}

export function NotificationEventRow({
  group,
  isLocked,
  isGlobalOn,
  getMachineExceptions,
  onMasterSwitchChange,
  onManageExceptions,
}: NotificationEventRowProps) {
  const renderChannel = (channel: Channel, icon: React.ElementType) => {
    const type = `${group.eventKey}.${channel}`;
    const locked = isLocked(type);
    const globalOn = isGlobalOn(group.eventKey, channel);
    const exceptions = getMachineExceptions(group.eventKey, channel);

    // El "Switch Maestro" está ON si Global está ON o si hay excepciones
    const isChecked = globalOn || exceptions.size > 0;

    const statusText = () => {
      if (globalOn) return <span>Global ON</span>;
      if (exceptions.size > 0) return <span className="text-primary">{exceptions.size} Machine(s) ON</span>;
      return <span>Global OFF</span>;
    };

    return (
      <div className="space-y-1 rounded-lg bg-muted/50 p-3">
        {/* Top row: switch + label + manage button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id={type}
              checked={isChecked}
              onCheckedChange={(checked) => onMasterSwitchChange(group.eventKey, channel, checked)}
              disabled={locked}
            />
            <Label htmlFor={type} className={cn('flex items-center gap-1.5 text-sm', locked ? 'text-muted-foreground/50' : 'text-muted-foreground')}>
              {React.createElement(icon, { className: 'h-4 w-4' })}
              {channel.charAt(0).toUpperCase() + channel.slice(1)}
            </Label>

            {locked && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This setting is managed by your administrator.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            disabled={locked}
            onClick={() => onManageExceptions(group.eventKey, channel)}
          >
            <Settings2 className="mr-2 h-3 w-3" />
          </Button>
        </div>

        {/* Second row: Status text */}
        <div className="text-xs text-muted-foreground italic">{statusText()}</div>
      </div>
    );
  };

  return (
    <div className="rounded-lg bg-background p-4 shadow-md drop-shadow-sm">
      <Label className="text-base font-semibold">{group.description.replace(/^In-App:\s*/i, '')}</Label>{' '}
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
        {group.channels.in_app && renderChannel('in_app', Bell)}
        {group.channels.email && renderChannel('email', Mail)}
        {group.channels.teams && renderChannel('teams', AtSign)}
      </div>
    </div>
  );
}
