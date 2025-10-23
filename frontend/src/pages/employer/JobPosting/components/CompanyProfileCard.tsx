"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  getEmployerProfile,
  type EmployerProfileResponse,
} from "@/services/employerProfile";
import { Skeleton } from "@/components/ui/skeleton";

const initialsOf = (name?: string | null) =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "CO";

/** enum → label */
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
};

const CompanyProfileCard = ({ userId }: Props) => {
  const [profile, setProfile] = useState<EmployerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await getEmployerProfile(userId);
        if (!cancelled) setProfile(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load company profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (userId) run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

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

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: avatar + info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">
              {initialsOf(companyName)}
            </span>
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

        {/* Right: edit button */}
        <Button
          asChild
          variant="outline"
          className="w-full lg:w-auto lg:ml-auto lg:flex-none px-4 lg:px-8 border-primary text-primary hover:bg-primary hover:text-white"
        >
          <Link to={`/employer/profile/${userId}`}>Edit Company Profile</Link>
        </Button>
      </div>
    </div>
  );
};

export default CompanyProfileCard;
