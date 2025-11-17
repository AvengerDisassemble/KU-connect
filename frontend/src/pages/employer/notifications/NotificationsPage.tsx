import { useMemo, useState } from "react";
import { Inbox, Loader2, RefreshCcw } from "lucide-react";

import EmployerPageShell from "@/components/EmployerPageShell";
import NotificationItem from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import {
  useNotifications,
  type NotificationFilter,
} from "@/hooks/useNotifications";
import type { Notification } from "@/types/notifications";

const EmployerNotificationsPage = () => {
  const { user } = useAuth();
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

  const handleMarkAsRead = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification);
    }
  };

  const processingId = markAsReadMutation.variables?.id;

  const isUserResolved = Boolean(user?.id);
  const isLoading = query.isLoading || !isUserResolved;
  const isError = query.isError && isUserResolved;
  const isFetching = query.isFetching;

  return (
    <EmployerPageShell title="Notifications">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Review updates about job applications, approvals, and platform
            alerts.
          </p>
        </header>

        <section className="rounded-xl bg-card shadow-sm">
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Inbox
                </p>
                <p className="text-sm text-muted-foreground">
                  {!isUserResolved
                    ? "Preparing your inbox..."
                    : isFetching
                    ? "Checking for new notifications..."
                    : unreadCount > 0
                    ? `${unreadCount} unread`
                    : "You're all caught up"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={filter === "all" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-4"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "unread" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-4"
                  onClick={() => setFilter("unread")}
                >
                  Unread
                </Button>
              </div>
            </div>

            <Separator />

            <div className="min-h-[240px]">
              {isLoading ? (
                <div className="flex h-56 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading notifications...
                </div>
              ) : isError ? (
                <div className="flex h-56 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                  <p>We couldn&apos;t load your notifications.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => query.refetch()}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Try again
                  </Button>
                </div>
              ) : filteredNotifications.length > 0 ? (
                <div className="flex flex-col gap-3" role="list">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      isProcessing={processingId === notification.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-56 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <Inbox className="h-10 w-10" />
                  <p>No notifications to show.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </EmployerPageShell>
  );
};

export default EmployerNotificationsPage;
