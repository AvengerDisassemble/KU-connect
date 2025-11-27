import { BASE_URL } from "@/lib/config";
import { clearAuthSession, refreshAccessToken } from "@/services/auth";

const buildAuthorizedRequest = (init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers);
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

const fetchWithAuth = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  let response = await fetch(input, buildAuthorizedRequest(init));

  if (response.status === 401) {
    try {
      await refreshAccessToken();
    } catch (error) {
      clearAuthSession();
      throw error instanceof Error
        ? error
        : new Error("Session expired. Please log in again.");
    }

    response = await fetch(input, buildAuthorizedRequest(init));

    if (response.status === 401) {
      clearAuthSession();
      throw new Error("Session expired. Please log in again.");
    }
  }

  return response;
};

export const deleteAccount = async (userId: string): Promise<void> => {
  if (!userId) {
    throw new Error("A valid user ID is required to delete the account.");
  }

  const response = await fetchWithAuth(`${BASE_URL}/user/${userId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    let message = "Failed to delete account.";
    try {
      const data = await response.json();
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
};
