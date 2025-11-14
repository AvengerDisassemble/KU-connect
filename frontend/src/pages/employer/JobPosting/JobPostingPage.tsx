"use client";

import { useAuth } from "@/hooks/useAuth";
import EmployerPageShell from "@/components/EmployerPageShell";
import CompanyProfileCard from "@/pages/employer/JobPosting/components/CompanyProfileCard";
import JobPostingForm from "@/pages/employer/JobPosting/components/JobPostingForm";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  getEmployerProfile,
  type EmployerProfileResponse,
} from "@/services/employerProfile";

export default function JobPostingPage() {
  const { user, isAuthenticated } = useAuth();
  const employerId = user?.id;

  const {
    data: employerProfile,
    isLoading: employerProfileLoading,
    isError: employerProfileError,
  } = useQuery<EmployerProfileResponse>({
    queryKey: ["employer-profile", employerId],
    queryFn: () => {
      if (!employerId) {
        throw new Error("Missing employer id");
      }

      return getEmployerProfile(employerId);
    },
    enabled: Boolean(employerId),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  if (!isAuthenticated || !user) {
    return (
      <>
        <div className="fixed inset-0 -z-50 pointer-events-none bg-bg-1" />

        <main className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-semibold">Please sign in</h1>

            <p className="text-muted-foreground">
              You must be logged in to post a job.
            </p>
          </div>
        </main>
      </>
    );
  }

  if (!hasEmployerAccess) {
    return (
      <>
        <div className="fixed inset-0 -z-50 pointer-events-none bg-bg-1" />

        <main className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-semibold">Access denied</h1>

            <p className="text-muted-foreground">
              Only employer (or admin) accounts can post jobs.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <EmployerPageShell title="Post a Job">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-8 text-3xl font-bold text-accent">Post a Job</h1>

          <p className="text-muted-foreground">
            Connect with talented KU engineering students ready to join your
            team
            Connect with talented KU engineering students ready to join your
            team
          </p>
        </div>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <CompanyProfileCard
              userId={user.id}
              prefetchedProfile={employerProfile}
              loadingOverride={employerProfileLoading}
            />
            {employerProfileError && (
              <p className="mt-4 text-sm text-destructive">
                Failed to load company profile. Please try again later.
              </p>
            )}
            <JobPostingForm
              userId={user.id}
              prefetchedProfile={employerProfile}
              profileLoading={employerProfileLoading}
            />
          </CardContent>
        </Card>
      </div>
    </EmployerPageShell>
  );
}
