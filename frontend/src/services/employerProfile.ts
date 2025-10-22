import { BASE_URL } from "@/lib/config";
import { refreshAccessToken } from "@/services/auth";

// Generic API
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface EmployerProfileResponse {
  id: string;
  name: string;
  surname: string;
  username?: string | null;
  email: string;
  verified: boolean;
  hr?: {
    id: string;
    userId: string;
    companyName?: string | null;
    address?: string | null;
    website?: string | null;
    industry?: string | null;
    companySize?: string | null;
    // description?: string | null; // will be added later
    // phoneNumber?: string | null; // will be added later
  };
}

export interface UpdateEmployerProfileRequest {
  userId: string;
  companyName?: string;
  address?: string;
  website?: string;
  industry?: string;
  companySize?: string;
}

// internal helpers
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

// APIs

// GET /profile/:userId
export const getEmployerProfile = async (userId: string): Promise<EmployerProfileResponse> => {
  const res = await authorizedFetch(`${BASE_URL}/profile/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  const body: ApiResponse<EmployerProfileResponse> = await res.json();
  if (!body.success) throw new Error(body.message || "Failed to fetch profile");
  return body.data;
};

// PATCH /profile
export const updateEmployerProfile = async (
  data: UpdateEmployerProfileRequest
): Promise<EmployerProfileResponse> => {
  const res = await authorizedFetch(`${BASE_URL}/profile`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  const body: ApiResponse<EmployerProfileResponse> = await res.json();
  if (!body.success) throw new Error(body.message || "Failed to update profile");
  return body.data;
};
