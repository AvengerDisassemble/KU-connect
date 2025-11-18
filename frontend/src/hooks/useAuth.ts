import { useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, setAuthSession } from "@/services/auth";

export type Role = "student" | "employer" | "admin" | "professor";

const AUTH_EVENT = "ku-connect-auth";

type StoredUser = {
  id: string;
  name: string;
  surname?: string;
  role: Role;
};

const normalizeStoredUser = (userData: unknown): StoredUser => {
  if (!userData || typeof userData !== "object") {
    throw new Error("Invalid user payload");
  }

  const { id, name, surname, role } = userData as Record<string, unknown>;

  if (typeof id !== "string" || !id) {
    throw new Error("Invalid user identifier");
  }

  if (typeof name !== "string" || !name) {
    throw new Error("Invalid user name");
  }

  if (typeof role !== "string" || !role) {
    throw new Error("Invalid user role");
  }

  const normalizedRole = role.toLowerCase();
  if (
    normalizedRole !== "student" &&
    normalizedRole !== "employer" &&
    normalizedRole !== "admin" &&
    normalizedRole !== "professor"
  ) {
    throw new Error("Unsupported user role");
  }

  return {
    id,
    name,
    surname: typeof surname === "string" ? surname : undefined,
    role: normalizedRole as Role,
  };
};

const readUserFromStorage = (): StoredUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    return null;
  }

  try {
    const userData = JSON.parse(storedUser);
    return normalizeStoredUser(userData);
  } catch (error) {
    console.error("Error parsing user data:", error);
    localStorage.removeItem("user");
    return null;
  }
};

export function useAuth() {
  const initialUser = useMemo(() => readUserFromStorage(), []);
  const [user, setUser] = useState<StoredUser | null>(initialUser);
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(
    Boolean(initialUser)
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncUser = () => {
      setUser(readUserFromStorage());
    };

    window.addEventListener("storage", syncUser);
    window.addEventListener(AUTH_EVENT, syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(AUTH_EVENT, syncUser);
    };
  }, []);

  useEffect(() => {
    if (hasAttemptedRestore || user) {
      return;
    }

    let cancelled = false;

    const restoreSession = async () => {
      try {
        const remoteUser = await fetchCurrentUser();
        if (!remoteUser || cancelled) {
          return;
        }
        const normalized = normalizeStoredUser(remoteUser);
        setAuthSession({ user: normalized });
        setUser(normalized);
      } catch (error) {
        console.warn("Failed to restore user session", error);
      } finally {
        if (!cancelled) {
          setHasAttemptedRestore(true);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [hasAttemptedRestore, user]);

  return {
    user,
    isAuthenticated: !!user,
  };
}
