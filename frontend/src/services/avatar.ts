import { BASE_URL } from "@/lib/config";
import { clearAuthSession, refreshAccessToken } from "@/services/auth";

export const AVATAR_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface AvatarValidationResult {
  valid: boolean;
  error?: string;
}

export interface AvatarServiceError extends Error {
  status?: number;
}

const toAvatarError = (
  message: string,
  status?: number
): AvatarServiceError => {
  const error = new Error(message) as AvatarServiceError;
  if (typeof status === "number") {
    error.status = status;
  }
  return error;
};

const buildRequestInit = (init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers ?? {});
  const isFormData = init?.body instanceof FormData;

  if (!headers.has("Content-Type") && !isFormData) {
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
      throw toAvatarError(
        error instanceof Error
          ? error.message
          : "Session expired. Please log in again.",
        401
      );
    }

    response = await fetch(input, buildRequestInit(init));

    if (response.status === 401) {
      clearAuthSession();
      throw toAvatarError("Session expired. Please log in again.", 401);
    }
  }

  return response;
};

export const validateAvatarFile = (file: File): AvatarValidationResult => {
  if (
    !AVATAR_ACCEPTED_TYPES.includes(
      file.type as (typeof AVATAR_ACCEPTED_TYPES)[number]
    )
  ) {
    return {
      valid: false,
      error: "Please upload a JPG, PNG, or WebP image.",
    };
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return {
      valid: false,
      error: "Avatar must be smaller than 5MB.",
    };
  }

  return { valid: true };
};

export const downloadAvatar = async (userId: string): Promise<Blob | null> => {
  const response = await authorizedFetch(
    `${BASE_URL}/profile/avatar/${userId}/download`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw toAvatarError("Failed to download avatar.", response.status);
  }

  try {
    return await response.blob();
  } catch {
    throw toAvatarError("Avatar response was invalid.");
  }
};

export const uploadAvatar = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await authorizedFetch(`${BASE_URL}/profile/avatar`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "Failed to upload avatar.";
    try {
      const body = await response.json();
      if (typeof body?.message === "string" && body.message.trim()) {
        message = body.message;
      }
    } catch {
      // response was not JSON; keep default message
    }

    throw toAvatarError(message, response.status);
  }
};
