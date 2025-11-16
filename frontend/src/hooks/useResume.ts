import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/services/auth";
import { useAuth } from "@/hooks/useAuth";
import {
  uploadResume,
  type ResumeServiceError,
  type ResumeUploadOptions,
  isUnauthorizedError,
} from "@/services/resume";
import { useNavigate } from "react-router-dom";

interface UploadVariables {
  file: File;
  options?: ResumeUploadOptions;
}

export function useResume(explicitUserId?: string) {
  const { user } = useAuth();
  const userId = explicitUserId ?? user?.id ?? "";
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const hasRedirectedRef = useRef(false);

  const mutation = useMutation<void, ResumeServiceError, UploadVariables>({
    mutationFn: ({ file, options }) => uploadResume(file, options),
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });

  useEffect(() => {
    if (!mutation.error) return;
    if (!isUnauthorizedError(mutation.error) || hasRedirectedRef.current) {
      return;
    }
    hasRedirectedRef.current = true;
    logout()
      .catch(() => null)
      .finally(() => navigate("/login"));
  }, [mutation.error, navigate]);

  const upload = useMemo(
    () =>
      userId
        ? (file: File, options?: ResumeUploadOptions) =>
            mutation.mutateAsync({ file, options })
        : undefined,
    [mutation, userId]
  );

  return {
    userId: userId || undefined,
    uploadResume: upload,
    isUploading: mutation.isPending,
    uploadError: mutation.error,
    resetUploadError: mutation.reset,
  } as const;
}
