export type NotificationCategory =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "application_status"
  | "job_update"
  | "system";

export interface NotificationData {
  applicationId?: string;
  jobId?: string;
  status?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationCategory;
  isRead: boolean;
  createdAt: string;
  announcementId?: string | null;
  data?: NotificationData;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  hasMore?: boolean;
  lastFetchedAt?: string;
}
