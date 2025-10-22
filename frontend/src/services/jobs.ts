import { BASE_URL } from "@/lib/config";
import { refreshAccessToken } from "@/services/auth";

/** Generic API */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  location: string;
  jobType: string;            // e.g. "internship"
  workArrangement: string;    // e.g. "hybrid"
  duration?: string;
  minSalary?: number;
  maxSalary?: number;
  application_deadline?: string; // ISO string "2025-12-31T23:59:59Z"
  email?: string;
  phone_number?: string;
  other_contact_information?: string | null;
  requirements?: string[];
  qualifications?: string[];
  responsibilities?: string[];
  benefits?: string[];
  tags?: string[]; // ["backend", "nodejs", "internship"]
}

export interface CreatedJobResponse {
  id: string;
  hrId: string;
  title: string;
  companyName?: string;
  description: string;
  location: string;
  jobType: string;
  workArrangement: string;
  duration?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  application_deadline?: string | null;
  email?: string | null;
  phone_number?: string | null;
  other_contact_information?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Internal helpers */
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

/** APIs */

// POST /api/job
export const createJob = async (payload: CreateJobRequest): Promise<CreatedJobResponse> => {
  console.log("[jobs.createJob] payload:", payload);

  const res = await authorizedFetch(`${BASE_URL}/job`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let serverMsg = `HTTP ${res.status}`;
    let serverBody: unknown = null;

    try {
      serverBody = await res.json();
      const msg =
        (serverBody as any)?.message ||
        (serverBody as any)?.error ||
        (serverBody as any)?.errors ||
        (serverBody as any)?.detail ||
        (serverBody as any)?.details;

      if (typeof msg === "string") serverMsg = `${serverMsg} – ${msg}`;
      else if (msg) serverMsg = `${serverMsg} – ${JSON.stringify(msg)}`;
    } catch {
      try {
        const text = await res.text();
        if (text) serverMsg = `${serverMsg} – ${text}`;
      } catch {
        /* ignore */
      }
    }

    console.error("[jobs.createJob] server error:", serverBody || serverMsg);
    throw new Error(serverMsg);
  }

  const body: ApiResponse<CreatedJobResponse> = await res.json();
  if (!body.success) {
    console.error("[jobs.createJob] api error body:", body);
    throw new Error(body.message || "Failed to create job");
  }

  return body.data;
};