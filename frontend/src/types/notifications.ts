export type NotificationCategory =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "application_status"
  | "job_update"
  | "system";

export type NotificationType =
  | "ANNOUNCEMENT"
  | "APPLICATION_STATUS"
  | "EMPLOYER_APPLICATION";

export interface NotificationData {
  applicationId?: string;
  jobId?: string;
  status?: string;
  announcementId?: string | null;
  senderId?: string | null;
  sender?: {
    id: string;
    name: string;
    surname: string;
    role: string;
  } | null;
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
  notificationType?: NotificationType;
  data?: NotificationData;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  hasMore?: boolean;
  lastFetchedAt?: string;
}
