import { BASE_URL } from "@/lib/config";
import { clearAuthSession, refreshAccessToken } from "@/services/auth";
import { requestWithPolicies } from "./httpClient";
import type {
  Notification,
  NotificationsResponse,
  NotificationCategory,
} from "@/types/notifications";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

type NotificationType = 'ANNOUNCEMENT' | 'APPLICATION_STATUS' | 'EMPLOYER_APPLICATION';

type BackendNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
  senderId?: string | null;
  announcementId?: string | null;
  jobId?: string | null;
  applicationId?: string | null;
  sender?: {
    id: string;
    name: string;
    surname: string;
    role: string;
  } | null;
  announcement?: {
    id: string;
    title: string;
    content: string;
    priority?: string | null;
    audience?: string | null;
  } | null;
};

type BackendNotificationPayload = {
  notifications: BackendNotification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  hasMore?: boolean;
  lastFetchedAt?: string;
};

const buildRequestInit = (init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      headers.delete("Authorization");
    }
  }

  return {
    ...init,
    headers,
    credentials: "include",
  };
};

const authorizedFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  let response = await fetch(input, buildRequestInit(init));

  if (response.status === 401) {
    try {
      await refreshAccessToken();
    } catch (error) {
      clearAuthSession?.();
      throw error instanceof Error
        ? error
        : new Error("Session expired. Please log in again.");
    }

    response = await fetch(input, buildRequestInit(init));

    if (response.status === 401) {
      clearAuthSession?.();
      throw new Error("Session expired. Please log in again.");
    }
  }

  return response;
};

const readJson = async (res: Response) => {
  const text = await res.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const requestApi = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const method = (init?.method ?? "GET").toUpperCase();
  const res = await requestWithPolicies({
    key: `${method} ${path}`,
    execute: () => authorizedFetch(`${BASE_URL}${path}`, init),
  });

  const body = await readJson(res);

  if (!res.ok) {
    const message =
      (body as ApiResponse<T> | null)?.message ||
      `${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  const parsed = body as ApiResponse<T> | null;
  if (!parsed) {
    throw new Error("Invalid server response");
  }

  if (!parsed.success) {
    throw new Error(parsed.message || "Request failed");
  }

  return parsed.data;
};

const mapPriorityToCategory = (
  priority?: string | null
): NotificationCategory => {
  switch ((priority || "").toUpperCase()) {
    case "HIGH":
      return "warning";
    case "CRITICAL":
      return "error";
    case "LOW":
      return "info";
    case "MEDIUM":
    default:
      return "info";
  }
};

const transformNotification = (entry: BackendNotification): Notification => {
  // For announcement-type notifications, use announcement data if available
  const title = entry.announcement?.title || entry.title;
  const message = entry.announcement?.content || entry.message;
  const priority = entry.announcement?.priority || entry.priority;
  const type = mapPriorityToCategory(priority);

  return {
    id: entry.id,
    title,
    message,
    type,
    isRead: entry.isRead,
    createdAt: entry.createdAt,
    announcementId: entry.announcementId,
    notificationType: entry.type, // Add notification type for frontend logic
    data: {
      announcementId: entry.announcement?.id || entry.announcementId,
      jobId: entry.jobId,
      applicationId: entry.applicationId,
      senderId: entry.senderId,
      sender: entry.sender,
    },
  };
};

export const getNotifications = async (
  unreadOnly = false
): Promise<NotificationsResponse> => {
  const params = new URLSearchParams();
  if (unreadOnly) {
    params.set("unreadOnly", "true");
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await requestApi<
    BackendNotification[] | BackendNotificationPayload
  >(`/notifications${suffix}`);

  const payload: BackendNotificationPayload = Array.isArray(response)
    ? { notifications: response }
    : response;

  const notifications = payload.notifications.map(transformNotification);
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return {
    notifications,
    unreadCount,
    hasMore: payload.hasMore ?? false,
    lastFetchedAt: payload.lastFetchedAt,
  };
};

export const markNotificationAsRead = async (
  id: string
): Promise<Notification> => {
  const entry = await requestApi<BackendNotification>(
    `/notifications/${id}/read`,
    {
      method: "PATCH",
    }
  );

  return transformNotification(entry);
};
