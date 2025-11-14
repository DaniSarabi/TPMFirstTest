import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Channel, GroupedNotification } from '../notifications';
import { NotificationEventRow } from './NotificationEventRow';

interface NotificationCategoryCardProps {
  categoryName: string;
  events: GroupedNotification[];
  isLocked: (type: string) => boolean;
  isGlobalOn: (eventKey: string, channel: Channel) => boolean;
  getMachineExceptions: (eventKey: string, channel: Channel) => Set<number>;
  onMasterSwitchChange: (eventKey: string, channel: Channel, checked: boolean) => void;
  onManageExceptions: (eventKey: string, channel: Channel) => void;
}

export function NotificationCategoryCard({ categoryName, events, ...handlers }: NotificationCategoryCardProps) {
  return (
    <Card className="border-0 drop-shadow-lg">
      <CardHeader>
        <CardTitle>{categoryName} Notifications</CardTitle>
        <CardDescription>Manage notifications for {categoryName.toLowerCase()} events.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((group) => (
          <NotificationEventRow key={group.eventKey} group={group} {...handlers} />
        ))}
      </CardContent>
    </Card>
  );
}
