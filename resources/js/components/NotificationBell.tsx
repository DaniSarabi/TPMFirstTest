import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import { Bell, CheckCheck } from 'lucide-react';
import * as React from 'react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

// Define la forma de una notificación
interface Notification {
  id: string;
  data: {
    message: string;
    url: string;
  };
  read_at: string | null;
  created_at: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get<{ notifications: Notification[]; unread_count: number }>(route('notifications.index'));
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Obtener notificaciones cuando el componente se monta
  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await axios.post(route('notifications.mark-all-as-read'));
      fetchNotifications(); // Re-fetch to update the state
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await axios.post(route('notifications.mark-as-read'), { id: notificationId });
      // We can optionally re-fetch here, or just let the navigation handle the state update
      // For a smoother UX, we can optimistically update the state
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-primary" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-0 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="rounded-2xl text-primary">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <DropdownMenuItem
                  asChild
                  className={cn(
                    // Apply a primary background color if the notification is unread
                    !notification.read_at && 'bg-muted/50',
                    !notification.read_at && 'text-accent-foreground',
                    'mt-2 mb-2 p-2 hover:cursor-pointer',
                  )}
                >
                  <Link href={notification.data.url} className="w-full" onClick={() => handleMarkAsRead(notification.id)}>
                      {!notification.read_at && (
                        <Badge variant="destructive" className="h-5 shrink-0 px-1.5 text-[10px] duration-300 animate-in fade-in zoom-in">
                          New
                        </Badge>
                      )}
                    <div className="flex w-full flex-col">
                      <p className="text-sm font-medium whitespace-normal">{notification.data.message}</p>
                      <div className="flex w-full justify-between">
                        <p className="text-xs">{new Date(notification.created_at).toLocaleDateString()}</p>
                        <p className="text-xs">{new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                {/* <Separator className="border-1 border-primary" /> */}
              </React.Fragment>
            ))
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">No new notifications.</p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleMarkAllAsRead} disabled={unreadCount === 0}>
          <CheckCheck className="mr-2 h-4 w-4" />
          <span>Mark all as read</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
