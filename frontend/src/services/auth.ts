import { BASE_URL } from "@/lib/config";
import type { PrivacyConsent } from "@/types/privacy";

export const AUTH_EVENT = "ku-connect-auth";

export interface AuthSessionPayload {
  accessToken?: string | null;
  refreshToken?: string | null;
  user?: unknown | null;
}

const ACCESS_TOKEN_KEYS = ["accessToken", "access_token"];
const REFRESH_TOKEN_KEYS = ["refreshToken", "refresh_token"];

function removeStoredKeys(keys: string[]) {
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

export function setAuthSession({
  accessToken,
  refreshToken,
  user,
}: AuthSessionPayload): void {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof accessToken === "string") {
    removeStoredKeys(ACCESS_TOKEN_KEYS);
    localStorage.setItem("accessToken", accessToken);
  } else if (accessToken === null) {
    removeStoredKeys(ACCESS_TOKEN_KEYS);
  }

  if (typeof refreshToken === "string") {
    removeStoredKeys(REFRESH_TOKEN_KEYS);
    localStorage.setItem("refreshToken", refreshToken);
  } else if (refreshToken === null) {
    removeStoredKeys(REFRESH_TOKEN_KEYS);
  }

  if (user && typeof user === "object") {
    localStorage.setItem("user", JSON.stringify(user));
  } else if (user === null) {
    localStorage.removeItem("user");
  }

  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuthSession(): void {
  setAuthSession({ accessToken: null, refreshToken: null, user: null });
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      surname: string;
      email: string;
      role: string;
      verified: boolean;
    };
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface CurrentUserResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      name?: string | null;
      surname?: string | null;
      role: string;
    };
  };
}

export interface RegisterData {
  name: string;
  surname: string;
  email: string;
  password: string;
  address: string;
  degreeTypeId: string;
  phoneNumber: string;
  privacyConsent?: PrivacyConsent;
}

export interface RegisterEmployerData {
  name: string;
  surname: string;
  email: string;
  password: string;
  phoneNumber: string;
  companyName: string;
  address: string;
  contactEmail?: string;
  industry?: string;
  privacyConsent?: PrivacyConsent;
}

/**
 * Login user and store tokens in localStorage
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMessage = "Login failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Response body was empty or invalid JSON
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  if (data.success) {
    const { accessToken, refreshToken, user } = data.data ?? {};
    const sessionPayload: AuthSessionPayload = {
      accessToken:
        typeof accessToken === "string" && accessToken.length > 0
          ? accessToken
          : null,
      refreshToken:
        typeof refreshToken === "string" && refreshToken.length > 0
          ? refreshToken
          : null,
    };
    if (user) {
      sessionPayload.user = user;
    }

    setAuthSession(sessionPayload);
  }

  return data;
}

/**
 * Logout user and clear tokens
 */
export async function logout(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const refreshToken = localStorage.getItem("refreshToken");
  const hasRefreshToken =
    typeof refreshToken === "string" && refreshToken.length > 0;

  try {
    await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      headers: hasRefreshToken
        ? {
            "Content-Type": "application/json",
          }
        : undefined,
      credentials: "include",
      body: hasRefreshToken ? JSON.stringify({ refreshToken }) : undefined,
    });
  } catch (error) {
    console.error("Logout request failed:", error);
  }

  clearAuthSession();
}

/**
 * Refresh access token using refresh token
 */
let refreshPromise: Promise<LoginResponse> | null = null;

export async function refreshAccessToken(): Promise<LoginResponse> {
  if (typeof window === "undefined") {
    throw new Error("Token refresh is only available in the browser");
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  const storedRefreshToken = localStorage.getItem("refreshToken");

  refreshPromise = (async (): Promise<LoginResponse> => {
    const payload: { refreshToken?: string | null } = {};
    if (storedRefreshToken) {
      payload.refreshToken = storedRefreshToken;
    }

    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    let parsed: LoginResponse | { message?: string; success?: boolean } | null =
      null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }

    const failureMessage =
      parsed &&
      typeof parsed === "object" &&
      "message" in parsed &&
      parsed.message
        ? String(parsed.message)
        : raw || "Token refresh failed";

    if (!response.ok) {
      console.error("Token refresh failed:", failureMessage);
      clearAuthSession();
      throw new Error(failureMessage);
    }

    if (!parsed || typeof parsed !== "object" || !("success" in parsed)) {
      clearAuthSession();
      throw new Error("Token refresh response was invalid");
    }

    const data = parsed as LoginResponse;

    if (!data.success) {
      clearAuthSession();
      throw new Error(data.message || failureMessage);
    }

    const { accessToken, refreshToken, user } = data.data ?? {};
    const sessionPayload: AuthSessionPayload = {};

    if (typeof accessToken === "string") {
      sessionPayload.accessToken = accessToken;
    }
    if (typeof refreshToken === "string") {
      sessionPayload.refreshToken = refreshToken;
    }
    if (user) {
      sessionPayload.user = user;
    }

    setAuthSession(sessionPayload);

    return data;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function fetchCurrentUser(): Promise<
  CurrentUserResponse["data"]["user"] | null
> {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  try {
    const data = (await response.json()) as CurrentUserResponse;
    return data?.data?.user ?? null;
  } catch (error) {
    console.error("Failed to parse /auth/me response", error);
    return null;
  }
}

/**
 * Register alumni user
 */
export async function registerAlumni(data: RegisterData) {
  const res = await fetch(`${BASE_URL}/register/alumni`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorBody = await res.json();
    const err = new Error(errorBody.message || "Registration failed");
    (err as Error & { errors?: unknown }).errors = errorBody.errors;
    throw err;
  }

  return await res.json();
}

/**
 * Register employer user
 */
export async function registerEmployer(data: RegisterEmployerData) {
  const res = await fetch(`${BASE_URL}/register/enterprise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let errorBody: { message?: string; errors?: unknown } | null = null;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = null;
    }

    const err = new Error(
      errorBody?.message || "Employer registration failed"
    ) as Error & { errors?: unknown };
    if (errorBody?.errors) {
      err.errors = errorBody.errors;
    }
    throw err;
  }

  return await res.json();
}
