import { BASE_URL } from "@/lib/config";
import { clearAuthSession, refreshAccessToken } from "@/services/auth";

export const TRANSCRIPT_ACCEPTED_TYPES = ["application/pdf"] as const;
export const MAX_TRANSCRIPT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

type TranscriptAcceptedType = (typeof TRANSCRIPT_ACCEPTED_TYPES)[number];

export interface TranscriptValidationResult {
  valid: boolean;
  error?: string;
}

export interface TranscriptUploadOptions {
  onProgress?: (progressPercent: number) => void;
  signal?: AbortSignal;
}

export interface DocumentServiceError extends Error {
  status?: number;
}

export interface DocumentDownloadResult {
  blob: Blob;
  filename?: string;
  contentType?: string;
}

const toDocumentError = (
  message: string,
  status?: number
): DocumentServiceError => {
  const error = new Error(message) as DocumentServiceError;
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
      throw toDocumentError(
        error instanceof Error
          ? error.message
          : "Session expired. Please log in again.",
        401
      );
    }

    response = await fetch(input, buildRequestInit(init));

    if (response.status === 401) {
      clearAuthSession();
      throw toDocumentError("Session expired. Please log in again.", 401);
    }
  }

  return response;
};

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

export const validateTranscriptFile = (
  file: File
): TranscriptValidationResult => {
  const mimeType = file.type as TranscriptAcceptedType | "";

  if (
    !TRANSCRIPT_ACCEPTED_TYPES.includes(mimeType as TranscriptAcceptedType)
  ) {
    return {
      valid: false,
      error: "Please upload a PDF transcript (10MB max).",
    };
  }

  if (file.size > MAX_TRANSCRIPT_SIZE_BYTES) {
    return {
      valid: false,
      error: "Transcript must be smaller than 10MB.",
    };
  }

  return { valid: true };
};

export const uploadTranscript = async (
  file: File,
  options?: TranscriptUploadOptions
): Promise<void> => {
  const attemptUpload = async (shouldRetry: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}/documents/transcript`);
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
          reject(toDocumentError("Upload cancelled by user."));
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
              toDocumentError(
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

        let message = "Failed to upload transcript.";
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

        reject(toDocumentError(message, xhr.status));
      };

      xhr.onerror = () => {
        if (options?.signal) {
          options.signal.removeEventListener("abort", handleAbort);
        }
        reject(toDocumentError("Network error while uploading transcript."));
      };

      xhr.onabort = () => {
        if (options?.signal) {
          options.signal.removeEventListener("abort", handleAbort);
        }
        reject(toDocumentError("Transcript upload aborted."));
      };

      const formData = new FormData();
      formData.append("transcript", file);
      xhr.send(formData);
    });
  };

  await attemptUpload(true);
};

const parseFilename = (headerValue: string | null): string | undefined => {
  if (!headerValue) return undefined;
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(
    headerValue
  );
  if (!match) return undefined;
  return decodeURIComponent(match[1] || match[2]);
};

const downloadDocument = async (
  endpoint: string,
  fallbackMessage: string
): Promise<DocumentDownloadResult> => {
  const response = await authorizedFetch(`${BASE_URL}${endpoint}`);

  if (!response.ok) {
    const bodyText = await response.text();
    let message = fallbackMessage;
    try {
      const parsed = JSON.parse(bodyText) as { message?: string };
      if (parsed?.message) {
        message = parsed.message;
      }
    } catch {
      if (bodyText.trim()) {
        message = bodyText.trim();
      }
    }
    throw toDocumentError(message, response.status);
  }

  const blob = await response.blob();
  const filename = parseFilename(response.headers.get("Content-Disposition"));
  const contentType = response.headers.get("Content-Type") ?? undefined;

  return { blob, filename, contentType };
};

export const downloadTranscript = async (
  userId: string
): Promise<DocumentDownloadResult> =>
  downloadDocument(
    `/documents/transcript/${userId}/download`,
    "Failed to download transcript."
  );

export const getTranscriptDownloadUrl = (userId: string): string => {
  return `${BASE_URL}/documents/transcript/${userId}/download`;
};

export const downloadEmployerVerification = async (
  userId: string
): Promise<DocumentDownloadResult> =>
  downloadDocument(
    `/documents/employer-verification/${userId}/download`,
    "Failed to download employer verification document."
  );

export const getEmployerVerificationDownloadUrl = (userId: string): string => {
  return `${BASE_URL}/documents/employer-verification/${userId}/download`;
};
