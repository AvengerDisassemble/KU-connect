import { BASE_URL } from "@/lib/config";
import { clearAuthSession, refreshAccessToken } from "@/services/auth";

export const RESUME_ACCEPTED_TYPES = ["application/pdf"] as const;

export const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

type ResumeAcceptedType = (typeof RESUME_ACCEPTED_TYPES)[number];

export interface ResumeValidationResult {
  valid: boolean;
  error?: string;
}

export interface ResumeServiceError extends Error {
  status?: number;
}

export interface ResumeMetadata {
  filename?: string;
  contentType?: string;
  contentLength?: number;
}

export interface ResumeUploadOptions {
  onProgress?: (progressPercent: number) => void;
  signal?: AbortSignal;
}

export interface ResumeDownloadResult {
  blob: Blob;
  filename?: string;
  contentType?: string;
}

const toResumeError = (
  message: string,
  status?: number
): ResumeServiceError => {
  const error = new Error(message) as ResumeServiceError;
  if (typeof status === "number") {
    error.status = status;
  }
  return error;
};

const buildRequestInit = (init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers ?? {});
  const isFormData = init?.body instanceof FormData;

  if (
    !headers.has("Content-Type") &&
    !isFormData &&
    init?.method &&
    init.method !== "HEAD"
  ) {
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
      throw toResumeError(
        error instanceof Error
          ? error.message
          : "Session expired. Please log in again.",
        401
      );
    }

    response = await fetch(input, buildRequestInit(init));

    if (response.status === 401) {
      clearAuthSession();
      throw toResumeError("Session expired. Please log in again.", 401);
    }
  }

  return response;
};

export const validateResumeFile = (file: File): ResumeValidationResult => {
  const mimeType = file.type as ResumeAcceptedType | "";

  if (!RESUME_ACCEPTED_TYPES.includes(mimeType as ResumeAcceptedType)) {
    return {
      valid: false,
      error: "Please upload a PDF resume (10MB max).",
    };
  }

  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return {
      valid: false,
      error: "Resume must be smaller than 10MB.",
    };
  }

  return { valid: true };
};

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

export const uploadResume = async (
  file: File,
  options?: ResumeUploadOptions
): Promise<void> => {
  const attemptUpload = async (shouldRetry: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}/documents/resume`);
      xhr.withCredentials = true;

      const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      const handleAbort = () => {
        xhr.abort();
      };

      if (options?.signal) {
        if (options.signal.aborted) {
          reject(toResumeError("Upload cancelled by user."));
          return;
        }
        options.signal.addEventListener("abort", handleAbort, { once: true });
      }

      xhr.upload.onprogress = (event) => {
        if (
          event.lengthComputable &&
          typeof options?.onProgress === "function"
        ) {
          const percent = Math.round((event.loaded / event.total) * 100);
          options.onProgress(percent);
        }
      };

      xhr.onload = async () => {
        if (options?.signal) {
          options.signal.removeEventListener("abort", handleAbort);
        }

        if (xhr.status === 401 && shouldRetry) {
          try {
            await refreshAccessToken();
          } catch (error) {
            clearAuthSession();
            reject(
              toResumeError(
                error instanceof Error
                  ? error.message
                  : "Session expired. Please log in again.",
                401
              )
            );
            return;
          }

          try {
            await attemptUpload(false);
            resolve();
          } catch (retryError) {
            reject(retryError);
          }
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
          return;
        }

        let message = "Failed to upload resume.";
        try {
          const responseJson = JSON.parse(xhr.responseText);
          if (
            typeof responseJson?.message === "string" &&
            responseJson.message.trim()
          ) {
            message = responseJson.message;
          }
        } catch {
          // ignore non-JSON responses
        }

        reject(toResumeError(message, xhr.status));
      };

      xhr.onerror = () => {
        if (options?.signal) {
          options.signal.removeEventListener("abort", handleAbort);
        }
        reject(toResumeError("Network error while uploading resume."));
      };

      xhr.onabort = () => {
        if (options?.signal) {
          options.signal.removeEventListener("abort", handleAbort);
        }
        reject(toResumeError("Upload aborted."));
      };

      const formData = new FormData();
      formData.append("resume", file);

      try {
        xhr.send(formData);
      } catch (error) {
        if (options?.signal) {
          options.signal.removeEventListener("abort", handleAbort);
        }
        reject(
          toResumeError(
            error instanceof Error
              ? error.message
              : "Failed to start resume upload."
          )
        );
      }
    });
  };

  await attemptUpload(true);
};

const parseContentDisposition = (header: string | null): string | undefined => {
  if (!header) return undefined;
  const filenameMatch = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(
    header
  );
  if (!filenameMatch) return undefined;
  const encodedFilename = filenameMatch[1] || filenameMatch[2];
  if (!encodedFilename) return undefined;
  try {
    return decodeURIComponent(encodedFilename);
  } catch {
    return encodedFilename;
  }
};

const parseResumeMetadata = (headers: Headers): ResumeMetadata => {
  const contentLength = headers.get("content-length");
  const contentType = headers.get("content-type") ?? undefined;
  const contentDisposition = headers.get("content-disposition");

  return {
    filename: parseContentDisposition(contentDisposition),
    contentType,
    contentLength: contentLength
      ? Number(contentLength) || undefined
      : undefined,
  };
};

export const fetchResumeMetadata = async (
  userId: string
): Promise<ResumeMetadata | null> => {
  const url = `${BASE_URL}/documents/resume/${userId}/download`;

  const response = await authorizedFetch(url, {
    method: "HEAD",
    redirect: "manual",
  });

  if (response.status === 404) {
    return null;
  }

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("Location");
    if (!location) {
      return null;
    }

    try {
      const redirected = await fetch(location, { method: "HEAD" });
      if (!redirected.ok) {
        return null;
      }
      return parseResumeMetadata(redirected.headers);
    } catch {
      return null;
    }
  }

  if (!response.ok) {
    throw toResumeError("Failed to fetch resume metadata.", response.status);
  }

  return parseResumeMetadata(response.headers);
};

export const getResumeDownloadUrl = (userId: string): string => {
  return `${BASE_URL}/documents/resume/${userId}/download`;
};

export const downloadResumeFile = async (
  userId: string
): Promise<ResumeDownloadResult> => {
  const url = `${BASE_URL}/documents/resume/${userId}/download`;

  const response = await authorizedFetch(url, {
    method: "GET",
    redirect: "manual",
  });

  if (response.status === 404) {
    throw toResumeError("No resume found for this student.", 404);
  }

  const metadataFromHeaders = parseResumeMetadata(response.headers);

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("Location");
    if (!location) {
      throw toResumeError("Resume redirect missing destination.");
    }

    const redirected = await fetch(location, { method: "GET" });
    if (!redirected.ok) {
      throw toResumeError("Failed to download resume.", redirected.status);
    }

    const blob = await redirected.blob();
    const redirectedMetadata = parseResumeMetadata(redirected.headers);

    return {
      blob,
      filename: redirectedMetadata.filename ?? metadataFromHeaders.filename,
      contentType:
        redirectedMetadata.contentType ?? metadataFromHeaders.contentType,
    };
  }

  if (!response.ok) {
    throw toResumeError("Failed to download resume.", response.status);
  }

  const blob = await response.blob();

  return {
    blob,
    filename: metadataFromHeaders.filename,
    contentType: metadataFromHeaders.contentType,
  };
};

export const isUnauthorizedError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: number }).status;
  return status === 401;
};
