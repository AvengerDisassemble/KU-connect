import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getNotifications,
  markNotificationAsRead,
} from "@/services/notifications";
import type {
  Notification,
  NotificationsResponse,
} from "@/types/notifications";

export type NotificationFilter = "all" | "unread";

interface UseNotificationsReturn {
  query: UseQueryResult<NotificationsResponse>;
  notifications: Notification[];
  unreadNotifications: Notification[];
  unreadCount: number;
  markAsReadMutation: UseMutationResult<
    Notification,
    unknown,
    Notification,
    { previous?: NotificationsResponse }
  >;
}

export const useNotifications = (userId?: string): UseNotificationsReturn => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", userId ?? "guest"],
    queryFn: () => getNotifications(),
    enabled: Boolean(userId),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notification: Notification) =>
      markNotificationAsRead(notification),
    onMutate: async (target) => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", userId ?? "guest"],
      });
      const previous = queryClient.getQueryData<NotificationsResponse>([
        "notifications",
        userId ?? "guest",
      ]);

      if (previous) {
        const notificationId = target.id;
        const wasUnread = previous.notifications.find(
          (n) => n.id === notificationId && !n.isRead
        );
        const next: NotificationsResponse = {
          notifications: previous.notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          ),
          unreadCount: Math.max(
            0,
            previous.unreadCount - (wasUnread ? 1 : 0)
          ),
        };
        queryClient.setQueryData(["notifications", userId ?? "guest"], next);
      }

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["notifications", userId ?? "guest"],
          context.previous
        );
      }
      const message =
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read.";
      toast.error(message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", userId ?? "guest"],
      });
    },
  });

  const notifications = query.data?.notifications ?? [];
  const unreadNotifications = notifications.filter(
    (notification) => !notification.isRead
  );

  return {
    query,
    notifications,
    unreadNotifications,
    unreadCount: query.data?.unreadCount ?? unreadNotifications.length,
    markAsReadMutation,
  };
};
