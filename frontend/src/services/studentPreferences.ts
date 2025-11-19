import { BASE_URL } from "@/lib/config";
import { clearAuthSession, refreshAccessToken } from "@/services/auth";

export interface StudentPreference {
  id?: string;
  studentId?: string;
  desiredLocation?: string | null;
  minSalary?: number | null;
  industry?: string | null;
  jobType?: string | null;
  remoteWork?: "on-site" | "remote" | "hybrid" | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentPreferenceUpdatePayload {
  desiredLocation?: string | null;
  minSalary?: number | null;
  industry?: string | null;
  jobType?: string | null;
  remoteWork?: "on-site" | "remote" | "hybrid" | null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
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

const PREFERENCES_ENDPOINT = `${BASE_URL}/students/preferences`;

export const fetchStudentPreferences = async (): Promise<
  StudentPreference | null
> => {
  const response = await authorizedFetch(PREFERENCES_ENDPOINT);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    let message = "Failed to load preferences";
    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const body =
    (await response.json()) as ApiResponse<StudentPreference | null>;

  if (!body.success) {
    throw new Error(body.message || "Failed to load preferences");
  }

  return body.data ?? null;
};

export const updateStudentPreferences = async (
  payload: StudentPreferenceUpdatePayload
): Promise<StudentPreference> => {
  const sanitizedEntries = Object.entries(payload).filter(
    ([, value]) => value !== undefined
  );

  if (sanitizedEntries.length === 0) {
    throw new Error("Please update at least one preference field.");
  }

  const response = await authorizedFetch(PREFERENCES_ENDPOINT, {
    method: "PATCH",
    body: JSON.stringify(Object.fromEntries(sanitizedEntries)),
  });

  const raw = await response.text();
  let parsed: ApiResponse<StudentPreference> | null = null;

  if (raw) {
    try {
      parsed = JSON.parse(raw) as ApiResponse<StudentPreference>;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok || !parsed) {
    const message =
      parsed?.message ||
      raw ||
      "Failed to update preferences. Please try again.";
    throw new Error(message);
  }

  if (!parsed.success) {
    throw new Error(parsed.message || "Failed to update preferences.");
  }

  return parsed.data;
};
