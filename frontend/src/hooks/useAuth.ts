import { useEffect, useState } from "react";

export type Role = "student" | "employer" | "admin" | "professor";

const AUTH_EVENT = "ku-connect-auth";

type StoredUser = {
  id: string;
  name: string;
  surname?: string;
  role: Role;
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
    return {
      id: userData.id,
      name: userData.name,
      surname: userData.surname,
      role: userData.role.toLowerCase() as Role,
    };
  } catch (error) {
    console.error("Error parsing user data:", error);
    localStorage.removeItem("user");
    return null;
  }
};

export function useAuth() {
  const [user, setUser] = useState<StoredUser | null>(() => {
    return readUserFromStorage();
  });

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

  return {
    user,
    isAuthenticated: !!user,
  };
}
