import { BASE_URL } from "@/lib/config";
import { refreshAccessToken } from "@/services/auth";
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
  } | null;
}

export interface JobListResponse {
  items: JobListItem[];
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
  phone_number?: string;
  other_contact_information?: string | null;
  requirements?: string[];
  qualifications?: string[];
  responsibilities?: string[];
  benefits?: string[];
  tags?: string[];
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
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    else headers.delete("Authorization");
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
      (body as ApiResponse<T> | null)?.message || `${res.status} ${res.statusText}`;
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

export const createJob = async (
  payload: JobCreateUpdatePayload
) => {
  return requestApi<JobDetail>("/job", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const listJobs = async (
  filters: Record<string, unknown> = {}
) => {
  return requestApi<JobListResponse>("/job/list", {
    method: "POST",
    body: JSON.stringify(filters),
  });
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
