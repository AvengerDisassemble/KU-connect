import { useMemo, useState } from "react";
import { Bell } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  type NotificationFilter,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

import NotificationDropdown from "./NotificationDropdown";

interface NotificationBellProps {
  userId?: string;
  className?: string;
}

export const NotificationBell = ({
  userId,
  className,
}: NotificationBellProps) => {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const {
    notifications,
    unreadNotifications,
    unreadCount,
    markAsReadMutation,
    query,
  } = useNotifications(userId);

  const filteredNotifications = useMemo(
    () => (filter === "unread" ? unreadNotifications : notifications),
    [filter, notifications, unreadNotifications]
  );

  const isLoading = query.isLoading;
  const isFetching = query.isFetching;
  const isError = query.isError;
  const refetch = query.refetch;

  const handleMarkAsRead = (notification: (typeof notifications)[number]) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification);
    }
  };

  const activeId = markAsReadMutation.variables?.id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-[5px] text-[10px] font-semibold text-primary-foreground">
              {unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto p-0" align="end" sideOffset={12}>
        <NotificationDropdown
          notifications={filteredNotifications}
          unreadCount={unreadCount}
          filter={filter}
          onFilterChange={setFilter}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          onRetry={refetch}
          onMarkAsRead={handleMarkAsRead}
          processingId={activeId}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
