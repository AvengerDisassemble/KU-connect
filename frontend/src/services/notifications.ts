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

type BackendNotification = {
  id: string;
  announcementId?: string | null;
  userId?: string;
  recipientId?: string;
  senderId?: string | null;
  isRead?: boolean;
  read?: boolean;
  createdAt: string;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  jobId?: string | null;
  applicationId?: string | null;
  sender?: {
    id: string;
    name?: string | null;
    surname?: string | null;
    role?: string | null;
  } | null;
  announcement?: {
    id: string;
    title: string;
    content: string;
    priority?: string | null;
    createdAt: string;
  } | null;
};

type BackendNotificationPayload = {
  notifications: BackendNotification[];
  hasMore?: boolean;
  lastFetchedAt?: string;
};

type BackendUserNotificationResponse = {
  notifications: BackendNotification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount?: number;
};

type BackendAnnouncement = {
  id: string;
  title: string;
  content: string;
  audience: string;
  priority?: string | null;
  createdAt: string;
  expiresAt?: string | null;
};

const ANNOUNCEMENT_SOURCE = "announcement" as const;
const ANNOUNCEMENT_ID_PREFIX = `${ANNOUNCEMENT_SOURCE}-`;
const ANNOUNCEMENT_READ_KEY = "ku-connect:announcement-read:v1";

const getAnnouncementReadSet = (): Set<string> => {
  if (typeof window === "undefined") {
    return new Set();
  }

  const raw = localStorage.getItem(ANNOUNCEMENT_READ_KEY);
  if (!raw) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
};

const persistAnnouncementReadSet = (ids: Set<string>) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(
    ANNOUNCEMENT_READ_KEY,
    JSON.stringify(Array.from(ids.values()))
  );
};

const markAnnouncementIdAsRead = (announcementId: string | undefined | null) => {
  if (!announcementId) {
    return;
  }
  const set = getAnnouncementReadSet();
  if (!set.has(announcementId)) {
    set.add(announcementId);
    persistAnnouncementReadSet(set);
  }
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

const mapBackendTypeToCategory = (
  type?: string | null,
  fallbackPriority?: string | null
): NotificationCategory => {
  if (type) {
    switch (type.toUpperCase()) {
      case "APPLICATION_STATUS":
      case "APPLICATION_STATUS_UPDATE":
        return "application_status";
      case "EMPLOYER_APPLICATION":
        return "job_update";
      case "SYSTEM":
        return "system";
      default:
        return "info";
    }
  }

  return mapPriorityToCategory(fallbackPriority);
};

const transformNotification = (entry: BackendNotification): Notification => {
  const title = entry.title ?? entry.announcement?.title ?? "Notification";
  const message = entry.message ?? entry.announcement?.content ?? "";
  const type = mapBackendTypeToCategory(entry.type, entry.announcement?.priority ?? null);
  const isRead = typeof entry.read === "boolean" ? entry.read : Boolean(entry.isRead);

  return {
    id: entry.id,
    title,
    message,
    type,
    isRead,
    createdAt: entry.createdAt,
    announcementId: entry.announcementId,
    data: {
      announcementId: entry.announcement?.id,
      jobId: entry.jobId ?? undefined,
      applicationId: entry.applicationId ?? undefined,
      sender: entry.sender
        ? {
            id: entry.sender.id,
            name: entry.sender.name,
            surname: entry.sender.surname,
            role: entry.sender.role,
          }
        : undefined,
      source: "user",
    },
  };
};

const transformAnnouncementNotification = (
  entry: BackendAnnouncement,
  readSet: Set<string>
): Notification => {
  return {
    id: `${ANNOUNCEMENT_ID_PREFIX}${entry.id}`,
    title: entry.title,
    message: entry.content,
    type: mapPriorityToCategory(entry.priority),
    isRead: readSet.has(entry.id),
    createdAt: entry.createdAt,
    announcementId: entry.id,
    data: {
      source: ANNOUNCEMENT_SOURCE,
      audience: entry.audience,
      expiresAt: entry.expiresAt ?? undefined,
    },
  };
};

const fetchAnnouncementNotifications = async (): Promise<BackendAnnouncement[]> => {
  try {
    return await requestApi<BackendAnnouncement[]>("/announcement");
  } catch {
    try {
      return await requestApi<BackendAnnouncement[]>("/announcements");
    } catch {
      return [];
    }
  }
};

export const getNotifications = async (
  unreadOnly = false
): Promise<NotificationsResponse> => {
  const params = new URLSearchParams();
  if (unreadOnly) {
    params.set("unreadOnly", "true");
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";

  const [response, announcementsResponse] = await Promise.all([
    requestApi<
      | BackendNotification[]
      | BackendNotificationPayload
      | BackendUserNotificationResponse
    >(`/notifications${suffix}`),
    fetchAnnouncementNotifications(),
  ]);

  let payload: BackendNotificationPayload | BackendUserNotificationResponse;
  if (Array.isArray(response)) {
    payload = { notifications: response };
  } else {
    payload = response;
  }

  const userNotifications = payload.notifications.map(transformNotification);
  const announcementReadSet = getAnnouncementReadSet();
  const announcementNotifications = (announcementsResponse as BackendAnnouncement[]).map(
    (entry) => transformAnnouncementNotification(entry, announcementReadSet)
  );

  const notifications = [...userNotifications, ...announcementNotifications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unreadCount = notifications.filter((notification) => !notification.isRead)
    .length;

  return {
    notifications,
    unreadCount,
    hasMore: (payload as BackendNotificationPayload).hasMore ?? false,
    lastFetchedAt: (payload as BackendNotificationPayload).lastFetchedAt,
  };
};

export const markNotificationAsRead = async (
  notification: Notification
): Promise<Notification> => {
  if (notification.data?.source === ANNOUNCEMENT_SOURCE) {
    const announcementId = notification.announcementId
      ? notification.announcementId
      : notification.id.startsWith(ANNOUNCEMENT_ID_PREFIX)
      ? notification.id.replace(ANNOUNCEMENT_ID_PREFIX, "")
      : undefined;
    markAnnouncementIdAsRead(announcementId);
    return { ...notification, isRead: true };
  }

  const entry = await requestApi<BackendNotification>(
    `/notifications/${notification.id}/read`,
    {
      method: "PATCH",
    }
  );

  return transformNotification(entry);
};
