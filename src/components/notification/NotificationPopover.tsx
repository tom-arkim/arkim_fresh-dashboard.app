import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';
import { ScrollArea } from '@/components/ui/shadcn/scroll-area';
import dayjs from 'dayjs';
import {
  AlertCircle,
  Bell,
  BellIcon,
  Check,
  Clock,
  Info,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import relativeTime from 'dayjs/plugin/relativeTime';
import { cn } from '@/lib/utils';

// Extend dayjs with the relativeTime plugin
dayjs.extend(relativeTime);

function NotificationPopover() {
  // dummy notification data
  const notificationData = [
    {
      id: '1',
      type: 'info',
      title: 'System Update',
      message: 'A new version is available for download',
      time: dayjs().subtract(10, 'minute'),
      read: false,
    },
    {
      id: '2',
      type: 'success',
      title: 'Payment Successful',
      message: 'Your subscription has been renewed',
      time: dayjs().subtract(1, 'hour'),
      read: false,
    },
    {
      id: '3',
      type: 'warning',
      title: 'Storage Almost Full',
      message: 'You are using 90% of your storage',
      time: dayjs().subtract(3, 'hour'),
      read: false,
    },
    {
      id: '4',
      type: 'error',
      title: 'Failed Login Attempt',
      message: 'Someone tried to access your account',
      time: dayjs().subtract(1, 'day'),
      read: true,
    },
    {
      id: '5',
      type: 'info',
      title: 'New Message',
      message: 'You have received a new message from support',
      time: dayjs().subtract(2, 'day'),
      read: true,
    },
  ];

  const [notifications, setNotifications] = useState<any[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-white text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h3 className="font-semibold text-sm">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              You have {unreadCount} unread notification
              {unreadCount > 1 ? 's' : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className={cn(unreadCount > 1 && "h-[400px]")}>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">
                No notifications
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent transition-colors ${!notification.read ? 'bg-accent/50' : ''
                    }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {dayjs(notification.time).fromNow()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeNotification(notification.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div>
          {notifications.length > 0 && (
            <Link
              to={'/notifications'}
              className="block w-full text-center text-sm font-medium p-3 hover:bg-accent hover:text-primary transition-colors bg-border/50"
            >
              View All Notification
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationPopover;
