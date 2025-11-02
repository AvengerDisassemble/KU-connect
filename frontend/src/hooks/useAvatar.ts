import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  downloadAvatar,
  uploadAvatar,
  type AvatarServiceError,
} from "@/services/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { logout } from "@/services/auth";

const isClientSide = typeof window !== "undefined";

const isUnauthorizedError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const maybeStatus = (error as { status?: number }).status;
  return maybeStatus === 401;
};

export function useAvatar(explicitUserId?: string) {
  const { user } = useAuth();
  const userId = explicitUserId ?? user?.id ?? "";
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const hasRedirectedRef = useRef(false);

  const queryKey = useMemo(() => ["avatar", userId] as const, [userId]);

  const avatarQuery = useQuery<Blob | null>({
    queryKey,
    enabled: Boolean(userId),
    queryFn: () => (userId ? downloadAvatar(userId) : Promise.resolve(null)),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: (failureCount, error) => {
      const status = (error as AvatarServiceError | undefined)?.status;
      if (status && status >= 400 && status < 500) {
        // Do not retry client errors (e.g., 401, 404)
        return false;
      }
      return failureCount < 3;
    },
  });

  const avatarUrl = useMemo(() => {
    if (!avatarQuery.data || !isClientSide) return null;
    return URL.createObjectURL(avatarQuery.data);
  }, [avatarQuery.data]);

  useEffect(() => {
    return () => {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  const uploadMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (_, file) => {
      if (!userId) return;
      queryClient.setQueryData(queryKey, file);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  useEffect(() => {
    const error = avatarQuery.error ?? uploadMutation.error;
    if (isUnauthorizedError(error) && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      logout()
        .catch(() => null)
        .finally(() => navigate("/login"));
    }
  }, [avatarQuery.error, uploadMutation.error, navigate]);

  return {
    avatarUrl,
    userId: userId || undefined,
    isLoading: avatarQuery.isLoading,
    isFetching: avatarQuery.isFetching,
    error: avatarQuery.error,
    refetch: avatarQuery.refetch,
    uploadAvatar: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    resetUploadError: uploadMutation.reset,
  };
}
