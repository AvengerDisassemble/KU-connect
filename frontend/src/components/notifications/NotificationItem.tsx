import { type FC, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertOctagon,
  AlertTriangle,
  Briefcase,
  Check,
  CheckCircle2,
  ClipboardList,
  Info,
  Loader2,
  ServerCog,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import type { Notification, NotificationCategory } from "@/types/notifications";

const categoryConfig: Record<
  NotificationCategory,
  { icon: FC<{ className?: string }>; containerClass: string }
> = {
  info: {
    icon: Info,
    containerClass: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200",
  },
  success: {
    icon: CheckCircle2,
    containerClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  },
  warning: {
    icon: AlertTriangle,
    containerClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  },
  error: {
    icon: AlertOctagon,
    containerClass:
      "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200",
  },
  application_status: {
    icon: ClipboardList,
    containerClass:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200",
  },
  job_update: {
    icon: Briefcase,
    containerClass: "bg-primary/10 text-primary",
  },
  system: {
    icon: ServerCog,
    containerClass: "bg-muted text-muted-foreground",
  },
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notification: Notification) => void;
  isProcessing?: boolean;
}

export const NotificationItem: FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  isProcessing = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = categoryConfig[notification.type] ?? categoryConfig.info;
  const Icon = config.icon;

  const showMarkAsRead = !notification.isRead;

  const handleMarkAsRead = () => {
    if (showMarkAsRead) {
      onMarkAsRead(notification);
    }
  };

  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  return (
    <div
      role="listitem"
      aria-live="polite"
      className={cn(
        "rounded-lg border border-transparent p-3 transition-colors",
        notification.isRead ? "bg-card" : "bg-muted/40",
        "hover:border-border hover:bg-muted/60"
      )}
    >
      <button
        type="button"
        className="flex w-full gap-3 text-left"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
      <span
        aria-hidden
        className={cn(
          "mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          config.containerClass,
          notification.isRead && "opacity-80"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="text-sm font-medium text-foreground line-clamp-1"
              title={notification.title}
            >
              {notification.title}
            </p>
          </div>

          {showMarkAsRead ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground"
              onClick={handleMarkAsRead}
              disabled={isProcessing}
              aria-label="Mark notification as read"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          ) : null}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {notification.message ? (
          <motion.div
            key="message"
            initial={false}
            animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="mt-2 break-words text-sm text-muted-foreground">
              {notification.message}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatRelativeTime(notification.createdAt)}</span>
          {!notification.isRead ? (
            <span
              className="flex h-2 w-2 rounded-full bg-primary"
              aria-hidden
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
