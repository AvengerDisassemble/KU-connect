import { BASE_URL } from "@/lib/config";

export interface ProfileResponse {
  id: number;
  name: string;
  surname: string;
  username: string;
  email: string;
  phoneNumber: string;
  verified: boolean;
  student: {
    id: number;
    userId: number;
    degreeTypeId: number;
    address: string;
    gpa: number;
    expectedGraduationYear: number;
    degreeType: {
      id: number;
      name: string;
    };
  };
}

export interface UpdateProfileRequest {
  userId: number;
  name?: string;
  surname?: string;
  gpa?: number;
  address?: string;
  expectedGraduationYear?: number;
  phoneNumber?: string;
  email?: string;
  degreeTypeId?: number;
}

export const getProfile = async (userId: number): Promise<ProfileResponse> => {
  const response = await fetch(`${BASE_URL}/profile/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }
  return response.json();
};

export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<ProfileResponse> => {
  const response = await fetch(`${BASE_URL}/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update profile");
  }
  return response.json();
};
