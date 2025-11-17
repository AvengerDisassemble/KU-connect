import { BASE_URL } from "@/lib/config";
import { refreshAccessToken } from "@/services/auth";
import { requestWithPolicies } from "./httpClient";

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

  return { ...init, headers, credentials: "include" };
};

const authorizedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let response = await fetch(input, buildRequestInit(init));
  if (response.status === 401) {
    try {
      await refreshAccessToken();
    } catch {
      throw new Error("Session expired. Please log in again.");
    }
    response = await fetch(input, buildRequestInit(init));
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
  const response = await requestWithPolicies({
    key: `${method} ${path}`,
    execute: () => authorizedFetch(`${BASE_URL}${path}`, init),
  });

  const body = (await readJson(response)) as ApiResponse<T> | null;

  if (!response.ok || !body) {
    const message = body?.message || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  if (!body.success) {
    throw new Error(body.message || "Request failed");
  }

  return body.data;
};

export interface ProfessorDashboardSummary {
  summary: {
    totalStudents: number;
    studentsWithApplications: number;
    totalApplications: number;
    totalActiveJobs: number;
    qualifiedRate: number;
  };
  applicationMetrics: {
    thisMonth: {
      count: number;
      percentChange: number;
      trend: "increasing" | "decreasing" | "stable";
    };
    byStatus: {
      pending: number;
      qualified: number;
      rejected: number;
    };
    averagePerStudent: number;
  };
  jobMetrics: {
    activeJobPostings: number;
    thisMonth: {
      newJobs: number;
      percentChange: number;
      trend: "increasing" | "decreasing" | "stable";
    };
    byJobType: Array<{
      type: string;
      count: number;
      applications: number;
    }>;
    topCompanies: Array<{
      companyName: string;
      jobCount: number;
      applicationCount: number;
    }>;
  };
  applicationTrends: {
    daily: Array<{ date: string; applications: number; newJobs: number }>;
    monthly: Array<{ month: string; applications: number; newJobs: number }>;
  };
  degreeTypeBreakdown: Array<{
    degreeTypeId: string;
    degreeTypeName: string;
    studentCount: number;
    applicationCount: number;
    qualifiedCount: number;
    qualifiedRate: number;
    averageGPA: number;
  }>;
  recentActivity: Array<{
    studentId: string;
    studentName: string;
    action: string;
    timestamp: string;
  }>;
}

export interface ProfessorStudentApplicationStats {
  total: number;
  pending: number;
  qualified: number;
  rejected: number;
  qualifiedRate: number;
}

export interface ProfessorStudentListItem {
  studentId: string;
  userId: string;
  name: string;
  surname: string;
  fullName: string;
  email: string;
  degreeType: {
    id: string;
    name: string;
  } | null;
  year: number | null;
  expectedGraduationYear: number | null;
  gpa: number | null;
  verified: boolean;
  hasResume: boolean;
  hasTranscript: boolean;
  applicationStats: ProfessorStudentApplicationStats;
  recentStatus: string | null;
  lastApplicationDate: string | null;
  createdAt: string;
}

export interface ProfessorStudentListSummary {
  totalStudents: number;
  filteredCount: number;
}

export interface ProfessorStudentListResponse {
  students: ProfessorStudentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: ProfessorStudentListSummary;
}

export interface ProfessorStudentDetailResponse {
  student: {
    studentId: string;
    userId: string;
    personalInfo: {
      name: string;
      surname: string;
      fullName: string;
      email: string;
      phoneNumber: string | null;
      address: string | null;
      avatarUrl: string | null;
      verified: boolean;
      joinedAt: string;
    };
    academicInfo: {
      degreeType: {
        id: string;
        name: string;
      };
      currentYear: number;
      expectedGraduationYear: number;
      gpa: number;
      hasResume: boolean;
      hasTranscript: boolean;
      hasVerificationDoc: boolean;
    };
    applicationStatistics: {
      total: number;
      byStatus: {
        pending: number;
        qualified: number;
        rejected: number;
      };
      qualifiedRate: number;
      firstApplicationDate: string | null;
      lastApplicationDate: string | null;
      averageApplicationsPerMonth: number;
    };
    jobPreferences: {
      mostAppliedJobType: string | null;
      mostAppliedLocations: string[];
      interestedJobsCount: number;
    };
  };
  applicationHistory: Array<{
    id: string;
    jobTitle: string;
    companyName: string;
    status: string;
    submittedAt: string;
  }>;
  interestedJobs: Array<{
    jobId: string;
    jobTitle: string;
    companyName: string;
    savedAt: string;
  }>;
}

export interface ProfessorStudentQuery {
  page?: number;
  limit?: number;
  search?: string;
  degreeTypeId?: string;
  year?: number | string;
  status?: string;
}

export const getProfessorDashboardAnalytics = async () => {
  return requestApi<ProfessorDashboardSummary>("/professor/analytics/dashboard");
};

export const getProfessorStudents = async (
  query?: ProfessorStudentQuery,
) => {
  const params = new URLSearchParams();
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.search) params.set("search", query.search);
  if (query?.degreeTypeId) params.set("degreeTypeId", query.degreeTypeId);
  if (query?.year) params.set("year", String(query.year));
  if (query?.status) params.set("status", query.status);

  const qs = params.toString();
  const path = `/professor/students${qs ? `?${qs}` : ""}`;
  return requestApi<ProfessorStudentListResponse>(path);
};

export const getProfessorStudentDetail = async (studentId: string) => {
  return requestApi<ProfessorStudentDetailResponse>(`/professor/students/${studentId}`);
};
