import { BASE_URL } from "@/lib/config";
import { clearAuthSession, refreshAccessToken } from "@/services/auth";

export type JobResumeSource = "PROFILE" | "UPLOADED" | string;

export interface JobResumePayload {
  jobId: string;
  link: string;
  source: JobResumeSource;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

type UpsertJobResumeOptions =
  | { mode: "profile" }
  | { mode: "upload"; file: File };

const buildRequestInit = (init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers ?? {});
  const isFormData = init?.body instanceof FormData;

  if (!isFormData && init?.method && init.method !== "HEAD") {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
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
      clearAuthSession();
      throw error instanceof Error
        ? error
        : new Error("Session expired. Please log in again.");
    }

    response = await fetch(input, buildRequestInit(init));

    if (response.status === 401) {
      clearAuthSession();
      throw new Error("Session expired. Please log in again.");
    }
  }

  return response;
};

const parseResumeResponse = async (
  res: Response
): Promise<JobResumePayload> => {
  if (!res.ok) {
    let serverMsg = `HTTP ${res.status}`;
    try {
      const serverBody = await res.json();
      if (serverBody?.message) {
        serverMsg = `${serverMsg} – ${serverBody.message}`;
      }
    } catch {
      const text = await res.text();
      if (text) {
        serverMsg = `${serverMsg} – ${text}`;
      }
    }
    throw new Error(serverMsg);
  }

  const body: ApiResponse<JobResumePayload> = await res.json();

  if (!body.success) {
    throw new Error(body.message || "Failed to process job resume");
  }

  return body.data;
};

export const upsertJobResume = async (
  jobId: string,
  options: UpsertJobResumeOptions
): Promise<JobResumePayload> => {
  const formData = new FormData();
  formData.append("mode", options.mode);

  if (options.mode === "upload") {
    formData.append("resume", options.file);
  }

  const res = await authorizedFetch(`${BASE_URL}/jobs/${jobId}/resume`, {
    method: "POST",
    body: formData,
  });

  return parseResumeResponse(res);
};

export const deleteJobResume = async (jobId: string): Promise<void> => {
  const res = await authorizedFetch(`${BASE_URL}/jobs/${jobId}/resume`, {
    method: "DELETE",
  });

  if (!res.ok) {
    let serverMsg = `HTTP ${res.status}`;
    try {
      const serverBody = await res.json();
      if (serverBody?.message) {
        serverMsg = `${serverMsg} – ${serverBody.message}`;
      }
    } catch {
      const text = await res.text();
      if (text) {
        serverMsg = `${serverMsg} – ${text}`;
      }
    }
    throw new Error(serverMsg);
  }
};

export const downloadJobResume = async (
  jobId: string,
  studentUserId: string
): Promise<{ blob: Blob; filename: string }> => {
  const url = `${BASE_URL}/jobs/${jobId}/resume/${studentUserId}/download`;
  
  const res = await authorizedFetch(url, {
    method: "GET",
  });

  if (!res.ok) {
    let serverMsg = `HTTP ${res.status}`;
    try {
      const serverBody = await res.json();
      if (serverBody?.message) {
        serverMsg = `${serverMsg} – ${serverBody.message}`;
      }
    } catch {
      const text = await res.text();
      if (text) {
        serverMsg = `${serverMsg} – ${text}`;
      }
    }
    throw new Error(serverMsg);
  }

  const blob = await res.blob();
  
  // Extract filename from Content-Disposition header or use default
  const contentDisposition = res.headers.get("Content-Disposition");
  let filename = "resume.pdf";
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }

  return { blob, filename };
};
