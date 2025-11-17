import { BASE_URL } from "@/lib/config";
import { clearAuthSession, refreshAccessToken } from "@/services/auth";
import { requestWithPolicies } from "./httpClient";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface JobTag {
  id: string;
  name: string;
}

export interface JobListItem {
  id: string;
  hrId: string;
  title: string;
  companyName: string;
  description: string;
  location: string;
  jobType: string;
  workArrangement: string;
  duration: string;
  minSalary: number;
  maxSalary: number;
  application_deadline: string;
  email?: string | null;
  phone_number: string;
  other_contact_information?: string | null;
  createdAt: string;
  updatedAt: string;
  tags: JobTag[];
  hr?: {
    id: string;
    companyName?: string | null;
    description?: string | null;
    address?: string | null;
    industry?: string | null;
    companySize?: string | null;
    website?: string | null;
    phoneNumber?: string | null;
  } | null;
  isSaved?: boolean;
  isApplied?: boolean;
}

interface RawJobListResponse {
  items?: JobListItem[];
  jobs?: JobListItem[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface JobListResponse {
  jobs: JobListItem[];
  total: number;
  page: number;
  limit: number;
}

interface RequirementLike {
  id: string;
  text: string;
}

export interface JobDetail extends JobListItem {
  requirements: RequirementLike[];
  qualifications: RequirementLike[];
  responsibilities: RequirementLike[];
  benefits: RequirementLike[];
}

export interface JobCreateUpdatePayload {
  title: string;
  description: string;
  location: string;
  jobType: string;
  workArrangement: string;
  duration?: string;
  minSalary?: number;
  maxSalary?: number;
  application_deadline?: string;
  email?: string | null;
  phone_number?: string | null;
  other_contact_information?: string | null;
  requirements?: string[];
  qualifications?: string[];
  responsibilities?: string[];
  benefits?: string[];
  tags?: string[];
}

export interface Job {
  id: string;
  hrId: string;
  title: string;
  companyName: string;
  description: string;
  location: string;
  jobType: string;
  workArrangement: string;
  duration: string;
  minSalary: number;
  maxSalary: number;
  application_deadline: string;
  email?: string | null;
  phone_number: string;
  other_contact_information?: string | null;
  createdAt: string;
  updatedAt: string;
  tags: JobTag[];
  hr?: {
    id: string;
    companyName?: string | null;
    description?: string | null;
    address?: string | null;
    industry?: string | null;
    companySize?: string | null;
    website?: string | null;
    phoneNumber?: string | null;
  } | null;
  isSaved?: boolean;
  isApplied?: boolean;
}

export interface JobFilters {
  keyword?: string;
  jobType?: string;
  workArrangement?: string;
  location?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  studentId: string;
  resumeId?: string | null;
  status: "PENDING" | "QUALIFIED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    degreeType?: {
      id: string;
      name: string;
    } | null;
    user?: {
      id: string;
      name: string;
      surname?: string | null;
      email?: string | null;
    } | null;
    address?: string | null;
    gpa?: number | null;
    expectedGraduationYear?: number | null;
    interests?: { id: string; name: string }[];
  };
  resume?: {
    id: string;
    link: string;
  } | null;
}

const buildRequestInit = (init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    else headers.delete("Authorization");
  }

  return { ...init, headers, credentials: "include" };
};

const authorizedFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
) => {
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
  if (!text) return null;
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

const requestApiVoid = async (
  path: string,
  init?: RequestInit
): Promise<void> => {
  const method = (init?.method ?? "GET").toUpperCase();
  const res = await requestWithPolicies({
    key: `${method} ${path}`,
    execute: () => authorizedFetch(`${BASE_URL}${path}`, init),
  });

  if (res.status === 204) {
    return;
  }

  const body = await readJson(res);

  if (!res.ok) {
    const message =
      (body as ApiResponse<unknown> | null)?.message ||
      `${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  const parsed = body as ApiResponse<unknown> | null;
  if (!parsed) {
    throw new Error("Invalid server response");
  }

  if (!parsed.success) {
    throw new Error(parsed.message || "Request failed");
  }
};

export const createJob = async (payload: JobCreateUpdatePayload) => {
  return requestApi<JobDetail>("/job", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const listJobs = async (
  filters: Record<string, unknown> = {},
  page?: number,
  limit?: number
): Promise<JobListResponse> => {
  const payload: Record<string, unknown> = { ...filters };

  const hasExplicitPage = typeof page === "number" && Number.isFinite(page);
  const hasExplicitLimit = typeof limit === "number" && Number.isFinite(limit);

  if (hasExplicitPage) {
    payload.page = page;
  }
  if (hasExplicitLimit) {
    payload.limit = limit;
  }

  const resolvedPageRaw = Number(
    hasExplicitPage
      ? page
      : typeof payload.page === "number"
      ? payload.page
      : typeof payload.page === "string"
      ? payload.page
      : 1
  );
  const resolvedLimitRaw = Number(
    hasExplicitLimit
      ? limit
      : typeof payload.limit === "number"
      ? payload.limit
      : typeof payload.limit === "string"
      ? payload.limit
      : 25
  );

  const resolvedPage = Number.isFinite(resolvedPageRaw)
    ? Math.max(1, Math.trunc(resolvedPageRaw))
    : 1;
  const resolvedLimit = Number.isFinite(resolvedLimitRaw)
    ? Math.max(1, Math.trunc(resolvedLimitRaw))
    : 25;

  payload.page = resolvedPage;
  payload.limit = resolvedLimit;

  const response = await requestApi<RawJobListResponse>("/job/list", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const jobs = Array.isArray(response.jobs)
    ? response.jobs
    : Array.isArray(response.items)
    ? response.items
    : [];

  const total = typeof response.total === "number" ? response.total : 0;
  const pageValue =
    typeof response.page === "number" && response.page > 0
      ? response.page
      : resolvedPage;
  const limitValue =
    typeof response.limit === "number" && response.limit > 0
      ? response.limit
      : resolvedLimit;

  return {
    jobs,
    total,
    page: pageValue,
    limit: limitValue,
  };
};

export const getJobById = async (jobId: string) => {
  return requestApi<JobDetail>(`/job/${jobId}`);
};

export const updateJob = async (
  jobId: string,
  payload: Partial<JobCreateUpdatePayload>
) => {
  return requestApi<JobDetail>(`/job/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteJob = async (jobId: string) => {
  return requestApi<JobDetail>(`/job/${jobId}`, {
    method: "DELETE",
  });
};

export const getJobApplicants = async (jobId: string) => {
  return requestApi<JobApplication[]>(`/job/${jobId}/applyer`);
};

export interface ManageApplicationPayload {
  applicationId: string;
  status: "QUALIFIED" | "REJECTED";
}

export const manageApplication = async (
  jobId: string,
  payload: ManageApplicationPayload
) => {
  return requestApi<JobApplication>(`/job/${jobId}/applyer`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// Saved Jobs API Functions
interface RawSavedJobItem {
  savedAt?: string | null;
  job?: JobListItem | null;
}

interface RawSavedJobsResponse {
  items?: RawSavedJobItem[] | null;
  page?: number;
  pageSize?: number;
  total?: number;
}

interface SavedJobRecord {
  id: string;
  userId: string;
  jobId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ToggleSavedJobResult {
  isSaved: boolean;
}

export interface SavedJobsListResponse {
  jobs: JobListItem[];
  total: number;
  page: number;
  limit: number;
}

const normalizeSavedJobs = (
  payload: RawSavedJobsResponse | null | undefined
): SavedJobsListResponse => {
  const items = Array.isArray(payload?.items) ? payload?.items : [];
  const jobs: JobListItem[] = [];

  items.forEach((entry) => {
    const job = entry?.job;
    if (!job || typeof job.id !== "string") {
      return;
    }
    jobs.push({
      ...job,
      isSaved: true,
    });
  });

  const rawTotal =
    typeof payload?.total === "number"
      ? payload?.total
      : Number(payload?.total);
  const rawPage =
    typeof payload?.page === "number" ? payload?.page : Number(payload?.page);
  const rawPageSize =
    typeof payload?.pageSize === "number"
      ? payload?.pageSize
      : Number(payload?.pageSize);

  const total =
    Number.isFinite(rawTotal) && rawTotal >= 0 ? rawTotal : jobs.length;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0
      ? rawPageSize
      : Math.max(jobs.length || 0, 25);

  return {
    jobs,
    total,
    page,
    limit: pageSize,
  };
};

export const toggleSaveJob = async (
  userId: string,
  jobId: string,
  currentlySaved: boolean
): Promise<ToggleSavedJobResult> => {
  if (!userId) {
    throw new Error("Missing user ID.");
  }

  if (!jobId) {
    throw new Error("Missing job ID.");
  }

  const path = `/save-jobs/${userId}/saved`;

  if (currentlySaved) {
    await requestApiVoid(path, {
      method: "DELETE",
      body: JSON.stringify({ jobId }),
    });
    return { isSaved: false };
  }

  await requestApi<SavedJobRecord>(path, {
    method: "POST",
    body: JSON.stringify({ jobId }),
  });

  return { isSaved: true };
};

export const getSavedJobs = async (
  userId: string,
  page: number = 1,
  limit: number = 25
): Promise<SavedJobsListResponse> => {
  if (!userId) {
    throw new Error("Missing user ID.");
  }

  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: limit.toString(),
  });

  const raw = await requestApi<RawSavedJobsResponse>(
    `/save-jobs/${userId}/saved?${params.toString()}`
  );

  return normalizeSavedJobs(raw);
};

// Job Application API Functions
export interface JobApplicationPayload {
  resumeLink: string;
}

export const applyToJob = async (
  jobId: string,
  payload: JobApplicationPayload
) => {
  return requestApi<JobApplication>(`/job/${jobId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// Job Report API Functions
export interface JobReportPayload {
  reason: string;
}

export interface JobReportResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    jobId: string;
    reason: string;
    createdAt: string;
  };
}

export const reportJob = async (jobId: string, payload: JobReportPayload) => {
  return requestApi<JobReportResponse>(`/job/report/${jobId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export interface JobReportListResponse {
  success: boolean;
  message: string;
  data: {
    reports: {
      id: string;
      jobId: string;
      reason: string;
      createdAt: string;
      job: {
        id: string;
        title: string;
        companyName: string;
      };
      user: {
        id: string;
        name: string;
        email: string;
      };
    }[];
    total: number;
    page: number;
    limit: number;
  };
}

export const getReportedJobs = async (page: number = 1, limit: number = 25) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  return requestApi<JobReportListResponse>(`/job/report/list?${params}`);
};

export const deleteJobReport = async (reportId: string) => {
  return requestApi<{ success: boolean; message: string }>(
    `/job/report/${reportId}`,
    {
      method: "DELETE",
    }
  );
};
