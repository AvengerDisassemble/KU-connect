import { BASE_URL } from "@/lib/config";
import { clearAuthSession, refreshAccessToken } from "@/services/auth";
import { requestWithPolicies } from "./httpClient";

type Role = "STUDENT" | "EMPLOYER" | "ADMIN" | "PROFESSOR";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type RawJobItem = {
  id: string;
  title: string;
  location?: string | null;
  application_deadline?: string | null;
  hr?: {
    companyName?: string | null;
  } | null;
  _count?: {
    applications: number;
  };
};

type RawApplicationItem = {
  id: string;
  status: ApplicationItem["status"];
  createdAt: string;
  job: RawJobItem;
};

type RawStudentDashboard = {
  recentJobs?: RawJobItem[];
  myApplications?: RawApplicationItem[];
  quickActions?: string[];
};

type RawEmployerDashboard = {
  myJobPostings?: RawJobItem[];
  quickActions?: string[];
};

type RawProfessorDashboard = {
  departmentInfo?: {
    department?: string | null;
    role?: string | null;
  };
  quickActions?: string[];
};

type RawAdminDashboard = {
  systemStats?: {
    totalUsers: number;
    totalJobs: number;
    totalApplications: number;
  };
  recentUsers?: Array<{
    id: string;
    name?: string | null;
    surname?: string | null;
    email: string;
    role: Role;
    createdAt: string;
  }>;
  quickActions?: string[];
};

type RawDashboardPayload =
  | RawStudentDashboard
  | RawEmployerDashboard
  | RawProfessorDashboard
  | RawAdminDashboard
  | Record<string, unknown>;

interface RawDashboardData {
  userRole: Role;
  dashboard: RawDashboardPayload;
  timestamp?: string;
}

export interface JobItem {
  id: string;
  title: string;
  location?: string | null;
  applicationDeadline?: string | null;
  hr?: {
    companyName?: string | null;
  } | null;
}

export interface ApplicationItem {
  id: string;
  status: "PENDING" | "QUALIFIED" | "REJECTED";
  createdAt: string;
  job: {
    id: string;
    title: string;
    location?: string | null;
    applicationDeadline?: string | null;
    hr?: {
      companyName?: string | null;
    } | null;
  };
}

export interface StudentDashboardData {
  recentJobs?: JobItem[];
  myApplications?: ApplicationItem[];
  quickActions?: string[];
}

export interface EmployerJobPostingSummary {
  id: string;
  title: string;
  location?: string | null;
  applicationDeadline?: string | null;
  _count?: {
    applications: number;
  };
}

export interface EmployerDashboardData {
  myJobPostings?: EmployerJobPostingSummary[];
  quickActions?: string[];
}

export interface ProfessorDashboardData {
  departmentInfo?: {
    department?: string | null;
    role?: string | null;
  };
  quickActions?: string[];
}

export interface AdminDashboardData {
  systemStats?: {
    totalUsers: number;
    totalJobs: number;
    totalApplications: number;
  };
  recentUsers?: Array<{
    id: string;
    name?: string | null;
    surname?: string | null;
    email: string;
    role: Role;
    createdAt: string;
  }>;
  quickActions?: string[];
}

export type DashboardPayload =
  | StudentDashboardData
  | EmployerDashboardData
  | ProfessorDashboardData
  | AdminDashboardData
  | Record<string, unknown>;

export interface DashboardData {
  userRole: Role;
  dashboard: DashboardPayload;
  timestamp?: string;
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

const normalizeJobItem = (
  job: RawJobItem | null | undefined
): JobItem | null => {
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    title: job.title,
    location: job.location ?? null,
    applicationDeadline: job.application_deadline ?? null,
    hr: job.hr
      ? {
          companyName: job.hr.companyName ?? null,
        }
      : null,
  };
};

const normalizeApplicationItem = (
  application: RawApplicationItem | null | undefined
): ApplicationItem | null => {
  if (!application) {
    return null;
  }

  const job = normalizeJobItem(application.job);
  if (!job) {
    return null;
  }

  return {
    id: application.id,
    status: application.status,
    createdAt: application.createdAt,
    job,
  };
};

const normalizeDashboardPayload = (
  role: Role,
  payload: RawDashboardPayload
): DashboardPayload => {
  if (role === "STUDENT") {
    const data = payload as RawStudentDashboard;
    return {
      recentJobs: (data.recentJobs ?? [])
        .map((job) => normalizeJobItem(job))
        .filter((job): job is JobItem => Boolean(job)),
      myApplications: (data.myApplications ?? [])
        .map((application) => normalizeApplicationItem(application))
        .filter((application): application is ApplicationItem =>
          Boolean(application)
        ),
      quickActions: data.quickActions ?? [],
    } satisfies StudentDashboardData;
  }

  if (role === "EMPLOYER") {
    const data = payload as RawEmployerDashboard;
    const normalizedPostings: EmployerJobPostingSummary[] = [];

    for (const job of data.myJobPostings ?? []) {
      const normalized = normalizeJobItem(job);
      if (!normalized) {
        continue;
      }

      normalizedPostings.push({
        ...normalized,
        _count: job._count
          ? {
              applications: job._count.applications,
            }
          : undefined,
      });
    }

    return {
      myJobPostings: normalizedPostings,
      quickActions: data.quickActions ?? [],
    } satisfies EmployerDashboardData;
  }

  if (role === "PROFESSOR") {
    const data = payload as RawProfessorDashboard;
    return {
      departmentInfo: data.departmentInfo,
      quickActions: data.quickActions ?? [],
    } satisfies ProfessorDashboardData;
  }

  if (role === "ADMIN") {
    const data = payload as RawAdminDashboard;
    return {
      systemStats: data.systemStats,
      recentUsers: (data.recentUsers ?? []).map((user) => ({
        ...user,
        name: user.name ?? null,
        surname: user.surname ?? null,
      })),
      quickActions: data.quickActions ?? [],
    } satisfies AdminDashboardData;
  }

  return payload;
};

export const getDashboardData = async (): Promise<DashboardData> => {
  const raw = await requestApi<RawDashboardData>("/user-profile/dashboard");

  return {
    userRole: raw.userRole,
    timestamp: raw.timestamp,
    dashboard: normalizeDashboardPayload(raw.userRole, raw.dashboard),
  } satisfies DashboardData;
};
