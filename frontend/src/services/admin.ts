import { BASE_URL } from "@/lib/config";
import { clearAuthSession, refreshAccessToken } from "@/services/auth";
import { requestWithPolicies } from "./httpClient";

export interface AdminUserStats {
  total: number;
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
    suspended: number;
  };
  byRole: {
    student: number;
    employer: number;
    professor: number;
    admin: number;
  };
  growth: {
    thisWeek: number;
    thisMonth: number;
  };
  metrics: {
    approvalRate: number;
    pendingRate: number;
    rejectionRate: number;
  };
}

export interface AdminJobStats {
  total: number;
  active: number;
  inactive: number;
  growth: {
    thisWeek: number;
  };
  metrics: {
    activeRate: number;
  };
}

export interface AdminApplicationStats {
  total: number;
  thisMonth: number;
  byStatus: {
    pending: number;
    qualified: number;
    rejected: number;
  };
  growth: {
    thisWeek: number;
  };
  metrics: {
    qualificationRate: number;
    rejectionRate: number;
    averagePerJob: number;
  };
}

export interface AdminAnnouncementStats {
  total: number;
  active: number;
  inactive: number;
}

export interface AdminReportStats {
  total: number;
  unresolved: number;
  resolved: number;
}

export interface AdminTrendingJob {
  id: string;
  title: string;
  applicationsThisWeek: number;
}

export interface AdminAlertStats {
  pendingApprovals: number;
  unresolvedReports: number;
  inactiveJobs: number;
}

export interface AdminRecentActivity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AdminTrendPoint {
  date: string;
  count: number;
}

export interface AdminDashboardData {
  users: AdminUserStats;
  jobs: AdminJobStats;
  applications: AdminApplicationStats;
  announcements: AdminAnnouncementStats;
  reports: AdminReportStats;
  trending: {
    jobs: AdminTrendingJob[];
  };
  alerts: AdminAlertStats;
  recentActivity: AdminRecentActivity[];
  pendingVerifications: number;
  userRegistrationTrend: AdminTrendPoint[];
  quickActions?: string[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

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

export const getAdminDashboardStats = async (): Promise<AdminDashboardData> => {
  return requestApi<AdminDashboardData>("/admin/dashboard");
};

// User Management Types
export interface UserFilters {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserManagementItem {
  id: string;
  name: string;
  surname?: string | null;
  email: string;
  role: string;
  status: string;
  verified?: boolean;
  createdAt: string;
  lastLogin?: string | null;
  profileCompleted?: boolean;
}

export interface UserListResponse {
  users: UserManagementItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProfessorData {
  name: string;
  surname: string;
  email: string;
  department?: string;
  title?: string;
  password?: string;
}

export interface CreateProfessorResponse {
  user: UserManagementItem;
  professor?: {
    id: string;
    userId: string;
    department?: string | null;
    phoneNumber?: string | null;
    officeLocation?: string | null;
    title?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  credentials?: {
    temporaryPassword?: string;
  };
  emailSent?: boolean;
}

export interface UserActionResponse {
  success: boolean;
  message: string;
}

// User Management Functions
export const listUsers = async (
  filters?: UserFilters
): Promise<UserListResponse> => {
  const params = new URLSearchParams();

  if (filters?.role) params.append("role", filters.role);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());

  const queryString = params.toString();
  const endpoint = `/admin/users${queryString ? `?${queryString}` : ""}`;

  const payload = await requestApi<UserListResponse | UserManagementItem[]>(
    endpoint
  );

  if (Array.isArray(payload)) {
    const users = payload;
    const total = users.length;
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? Math.max(total, 1);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  return payload;
};

export const approveUser = async (
  userId: string
): Promise<UserActionResponse> => {
  return requestApi<UserActionResponse>(`/admin/users/${userId}/approve`, {
    method: "POST",
  });
};

export const rejectUser = async (
  userId: string,
  reason?: string
): Promise<UserActionResponse> => {
  return requestApi<UserActionResponse>(`/admin/users/${userId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
};

export const suspendUser = async (
  userId: string,
  reason?: string
): Promise<UserActionResponse> => {
  return requestApi<UserActionResponse>(`/admin/users/${userId}/suspend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
};

export const activateUser = async (
  userId: string
): Promise<UserActionResponse> => {
  return requestApi<UserActionResponse>(`/admin/users/${userId}/activate`, {
    method: "POST",
  });
};

export const createProfessorAccount = async (
  professorData: CreateProfessorData
): Promise<CreateProfessorResponse> => {
  return requestApi<CreateProfessorResponse>("/admin/users/professor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(professorData),
  });
};

export const searchUsers = async (
  query: string,
  filters?: UserFilters
): Promise<UserListResponse> => {
  return listUsers({ ...filters, search: query });
};

// Announcement Management Types
export type AnnouncementAudience =
  | "ALL"
  | "STUDENTS"
  | "EMPLOYERS"
  | "PROFESSORS"
  | "ADMINS";

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  audience: AnnouncementAudience;
  priority: "LOW" | "MEDIUM" | "HIGH";
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name?: string | null;
    surname?: string | null;
  } | null;
}

export interface AnnouncementSearchPayload {
  audience?: AnnouncementAudience;
  isActive?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AnnouncementSearchResult {
  announcements: AnnouncementItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AnnouncementMutationPayload {
  title: string;
  content: string;
  audience: AnnouncementAudience;
  priority: "LOW" | "MEDIUM" | "HIGH";
  expiresAt?: string | null;
  isActive?: boolean;
}

export const searchAnnouncements = async (
  payload: AnnouncementSearchPayload
): Promise<AnnouncementSearchResult> => {
  return requestApi<AnnouncementSearchResult>("/admin/announcements/search", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const createAnnouncement = async (
  payload: AnnouncementMutationPayload
): Promise<AnnouncementItem> => {
  return requestApi<AnnouncementItem>("/admin/announcements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateAnnouncement = async (
  announcementId: string,
  payload: Partial<AnnouncementMutationPayload>
): Promise<AnnouncementItem> => {
  return requestApi<AnnouncementItem>(
    `/admin/announcements/${announcementId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
};

export const deleteAnnouncement = async (
  announcementId: string
): Promise<null> => {
  return requestApi<null>(`/admin/announcements/${announcementId}`, {
    method: "DELETE",
  });
};

// Job Report Management Types
export interface JobReportItem {
  id: string;
  jobId: string;
  userId: string;
  reason: string;
  createdAt: string;
  job?: {
    id: string;
    title: string;
    description?: string | null;
    createdAt: string;
    hr?: {
      id: string;
      companyName?: string | null;
    } | null;
  } | null;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export const getJobReports = async (): Promise<JobReportItem[]> => {
  return requestApi<JobReportItem[]>("/job/report/list");
};
