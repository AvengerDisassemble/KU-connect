import { useMemo, useState } from "react";
import { Bell } from "lucide-react";

import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import {
  useNotifications,
  type NotificationFilter,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

type EmployerNotificationPopoverVariant = "icon" | "inline";

interface EmployerNotificationPopoverProps {
  className?: string;
  variant?: EmployerNotificationPopoverVariant;
}

const EmployerNotificationPopover = ({
  className,
  variant = "icon",
}: EmployerNotificationPopoverProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const {
    notifications,
    unreadNotifications,
    unreadCount,
    markAsReadMutation,
    query,
  } = useNotifications(user?.id);

  const filteredNotifications = useMemo(
    () => (filter === "unread" ? unreadNotifications : notifications),
    [filter, notifications, unreadNotifications]
  );

  const handleMarkAsRead = (notification: (typeof notifications)[number]) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification);
    }
  };

  const processingId =
    markAsReadMutation.isPending && markAsReadMutation.variables
      ? markAsReadMutation.variables.id
      : undefined;

  const badgeContent = unreadCount > 99 ? "99+" : `${unreadCount}`;

  const renderTriggerContent = () => {
    if (variant === "inline") {
      return (
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "relative inline-flex h-8 w-8 items-center justify-center rounded-full px-0 py-0 text-muted-foreground hover:bg-muted/40 focus-visible:ring-0 focus-visible:ring-offset-0",
            className
          )}
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
              {badgeContent}
            </span>
          ) : null}
        </Button>
      );
    }

    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("relative h-9 w-9 text-muted-foreground", className)}
        aria-label="View notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
            {badgeContent}
          </span>
        ) : null}
      </Button>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {renderTriggerContent()}
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={16}
        className="w-[360px] max-w-[calc(100vw-32px)] p-0 shadow-xl sm:w-[380px]"
      >
        <NotificationDropdown
          notifications={filteredNotifications}
          unreadCount={unreadCount}
          filter={filter}
          onFilterChange={setFilter}
          isLoading={query.isLoading}
          isFetching={query.isFetching}
          isError={query.isError}
          onRetry={query.refetch}
          onMarkAsRead={handleMarkAsRead}
          processingId={processingId}
        />
      </PopoverContent>
    </Popover>
  );
};

export default EmployerNotificationPopover;
