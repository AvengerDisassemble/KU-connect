"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchEmployerAvatar,
  getEmployerProfile,
  type EmployerProfileResponse,
} from "@/services/employerProfile";

const initialsOf = (name?: string | null) =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "CO";

const INDUSTRY_LABEL: Record<string, string> = {
  IT_HARDWARE_AND_DEVICES: "IT Hardware & Devices",
  IT_SOFTWARE: "IT Software",
  IT_SERVICES: "IT Services",
  NETWORK_SERVICES: "Network Services",
  EMERGING_TECH: "Emerging Tech",
  E_COMMERCE: "E-commerce",
  OTHER: "Other",
};

const COMPANY_SIZE_LABEL: Record<string, string> = {
  ONE_TO_TEN: "1-10",
  ELEVEN_TO_FIFTY: "11-50",
  FIFTY_ONE_TO_TWO_HUNDRED: "51-200",
  TWO_HUNDRED_ONE_TO_FIVE_HUNDRED: "201-500",
  FIVE_HUNDRED_PLUS: "500+",
};

type Props = {
  userId: string;
  prefetchedProfile?: EmployerProfileResponse | null;
  loadingOverride?: boolean;
};

const CompanyProfileCard: React.FC<Props> = ({
  userId,
  prefetchedProfile,
  loadingOverride,
}: Props) => {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<EmployerProfileResponse | null>(
    prefetchedProfile ?? null
  );
  const [loading, setLoading] = useState<boolean>(
    typeof loadingOverride === "boolean" ? loadingOverride : !prefetchedProfile
  );
  const [err, setErr] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const previousLogoUrlRef = useRef<string | null>(null);

  const avatarQueryKey = useMemo(
    () => ["employerAvatar", userId],
    [userId]
  );
  const previewQueryKey = useMemo(
    () => ["employerAvatarPreview", userId],
    [userId]
  );

  useEffect(() => {
    if (typeof loadingOverride === "boolean") {
      setLoading(loadingOverride);
    }
  }, [loadingOverride]);

  useEffect(() => {
    if (prefetchedProfile) {
      setProfile(prefetchedProfile);
      setErr(null);
      setLoading(false);
    }
  }, [prefetchedProfile]);

  useEffect(() => {
    if (prefetchedProfile) return;
    if (loadingOverride) return;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await getEmployerProfile(userId);
        if (cancelled) return;
        setProfile(data);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);
        if (!cancelled) setErr(message || "Failed to load company profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (userId) void run();
    return () => {
      cancelled = true;
    };
  }, [userId, prefetchedProfile, loadingOverride]);

  const {
    data: avatarData,
    isLoading: avatarLoading,
    isFetching: avatarFetching,
  } = useQuery<ArrayBuffer | null>({
    queryKey: avatarQueryKey,
    queryFn: () => fetchEmployerAvatar(userId),
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    initialData: () =>
      queryClient.getQueryData<ArrayBuffer | null>(avatarQueryKey),
  });

  const { data: previewUrl } = useQuery<string | null>({
    queryKey: previewQueryKey,
    initialData: () =>
      queryClient.getQueryData<string | null>(previewQueryKey) ?? null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (previousLogoUrlRef.current) {
      URL.revokeObjectURL(previousLogoUrlRef.current);
      previousLogoUrlRef.current = null;
    }

    if (!avatarData) {
      setLogoUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(new Blob([avatarData]));
    previousLogoUrlRef.current = objectUrl;
    setLogoUrl(objectUrl);

    return () => {
      if (previousLogoUrlRef.current === objectUrl) {
        URL.revokeObjectURL(objectUrl);
        previousLogoUrlRef.current = null;
      }
    };
  }, [avatarData]);

  useEffect(() => {
    return () => {
      if (previousLogoUrlRef.current) {
        URL.revokeObjectURL(previousLogoUrlRef.current);
        previousLogoUrlRef.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>
      </div>
    );
  }

  const companyName = profile?.hr?.companyName ?? "Your Company";
  const industryRaw = profile?.hr?.industry ?? "";
  const industry = INDUSTRY_LABEL[industryRaw] || industryRaw || "—";
  const sizeRaw = profile?.hr?.companySize ?? "";
  const companySize = COMPANY_SIZE_LABEL[sizeRaw] || sizeRaw || "";
  const address = profile?.hr?.address ?? "";
  const initials = initialsOf(companyName);
  const logoLoading = avatarLoading || avatarFetching;
  const displayedLogo = previewUrl ?? logoUrl;

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-primary text-primary-foreground">
            {logoLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : displayedLogo ? (
              <img
                src={displayedLogo}
                alt={`${companyName} logo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold">
                {initials}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {companyName}
            </h2>

            {!!err && <p className="text-destructive text-sm">{err}</p>}

            {!err && (
              <>
                <p className="text-muted-foreground text-sm">
                  {address ? `${address} • ${industry}` : industry}
                </p>
                {!!companySize && (
                  <p className="text-muted-foreground text-sm">
                    {companySize} employees
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          className="w-full lg:w-auto lg:ml-auto lg:flex-none px-4 lg:px-8 border-primary text-primary hover:bg-primary hover:text-white"
        >
          <Link to={`/employer/profile/${userId}`}>
            Edit Company Profile
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default CompanyProfileCard;
