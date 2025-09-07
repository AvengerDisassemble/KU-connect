import { useState } from "react";

export type Role = "student" | "employer" | "admin" | "professor";

export function useAuth() {
// Mock user just for now kub
  const [user] = useState<{ name: string; role: Role } | null>({
    name: "Sunthorn",
    role: "student",
  });
  return { user };
}
