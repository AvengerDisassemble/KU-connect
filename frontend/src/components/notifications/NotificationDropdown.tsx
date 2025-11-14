import { type FC } from "react";
import { Loader2, RefreshCcw, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Notification } from "@/types/notifications";
import type { NotificationFilter } from "@/hooks/useNotifications";
import NotificationItem from "./NotificationItem";

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  onMarkAsRead: (notification: Notification) => void;
  processingId?: string;
}

export const NotificationDropdown: FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  filter,
  onFilterChange,
  isLoading,
  isFetching,
  isError,
  onRetry,
  onMarkAsRead,
  processingId,
}) => {
  const hasNotifications = notifications.length > 0;

  return (
    <div className="w-[360px] md:w-[380px]">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          <p className="text-xs text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : isFetching
              ? "Checking for updates..."
              : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onFilterChange("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onFilterChange("unread")}
          >
            Unread
          </Button>
        </div>
      </div>

      <Separator />

      <div className="relative">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading notifications...
          </div>
        ) : isError ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
            <p>We couldn't load your notifications.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        ) : hasNotifications ? (
          <div className="max-h-80 overflow-y-auto">
            <div className="flex flex-col gap-2 p-3 pr-1" role="list">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  isProcessing={processingId === notification.id}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Inbox className="h-10 w-10" />
            <p>No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
