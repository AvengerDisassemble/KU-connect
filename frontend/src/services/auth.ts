import { BASE_URL } from "@/lib/config";

export const AUTH_EVENT = "ku-connect-auth";

export interface AuthSessionPayload {
  accessToken?: string | null;
  refreshToken?: string | null;
  user?: unknown | null;
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
    localStorage.setItem("accessToken", accessToken);
  } else if (accessToken === null) {
    localStorage.removeItem("accessToken");
  }

  if (typeof refreshToken === "string") {
    localStorage.setItem("refreshToken", refreshToken);
  } else if (refreshToken === null) {
    localStorage.removeItem("refreshToken");
  }

  if (user && typeof user === "object") {
    localStorage.setItem("user", JSON.stringify(user));
  } else if (user === null) {
    localStorage.removeItem("user");
  }

  window.dispatchEvent(new Event(AUTH_EVENT));
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

export interface RegisterData {
  name: string;
  surname: string;
  email: string;
  password: string;
  address: string;
  degreeTypeId: number;
}

export interface RegisterEmployerData {
  name: string;
  surname: string;
  email: string;
  password: string;
  companyName: string;
  address: string;
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
    setAuthSession({
      accessToken: accessToken ?? null,
      refreshToken: refreshToken ?? null,
      user: user ?? null,
    });
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

  if (refreshToken) {
    try {
      await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    }
  }

  setAuthSession({ accessToken: null, refreshToken: null, user: null });
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Token refresh failed:", errorText);
    throw new Error(errorText || "Token refresh failed");
  }

  const data = await response.json();

  // Update stored tokens
  if (data.success) {
    const { accessToken, refreshToken, user } = data.data ?? {};
    setAuthSession({
      accessToken: accessToken ?? null,
      refreshToken: refreshToken ?? null,
      user: user ?? null,
    });
  }

  return data;
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
