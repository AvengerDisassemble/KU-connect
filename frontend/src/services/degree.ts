import { BASE_URL } from "@/lib/config";

export interface DegreeType {
  id: string;
  name: string;
}

interface DegreeTypeResponse {
  success: boolean;
  message?: string;
  data?: DegreeType[];
}

/**
 * Fetches available degree types for registration forms.
 */
export async function fetchDegreeTypes(): Promise<DegreeType[]> {
  const response = await fetch(`${BASE_URL}/degree`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load degree types");
  }

  const body: DegreeTypeResponse = await response.json();

  if (!body.success || !Array.isArray(body.data)) {
    throw new Error(body.message || "Invalid degree type response");
  }

  return body.data;
}
