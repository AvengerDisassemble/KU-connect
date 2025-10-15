import { BASE_URL } from "@/lib/config";
import { refreshAccessToken } from "@/services/auth";

export interface ProfileResponse {
  id: string;
  name: string;
  surname: string;
  username?: string;
  email: string;
  verified: boolean;
  student?: {
    id: number;
    userId: string;
    degreeTypeId: number;
    address: string;
    gpa?: number;
    expectedGraduationYear?: number;
    degreeType: {
      id: number;
      name: string;
    };
  };
}

export interface UpdateProfileRequest {
  userId: string;
  name?: string;
  surname?: string;
  gpa?: number;
  address?: string;
  expectedGraduationYear?: number;
  email?: string;
  degreeTypeId?: number;
}

/**
 * Get user profile by ID
 */
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
    } catch {
      throw new Error("Session expired. Please log in again.");
    }

    response = await fetch(input, buildRequestInit(init));
  }

  return response;
};

export const getProfile = async (userId: string): Promise<ProfileResponse> => {
  const response = await authorizedFetch(`${BASE_URL}/profile/${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }
  const body: ApiResponse<ProfileResponse> = await response.json();

  if (!body.success) {
    throw new Error(body.message || "Failed to fetch profile");
  }

  return body.data;
};

/**
 * Update user profile
 */
export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<ProfileResponse> => {
  const response = await authorizedFetch(`${BASE_URL}/profile`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }
  const body: ApiResponse<ProfileResponse> = await response.json();

  if (!body.success) {
    throw new Error(body.message || "Failed to update profile");
  }

  return body.data;
};
