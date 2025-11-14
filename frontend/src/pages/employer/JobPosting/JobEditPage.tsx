"use client";

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import EmployerPageShell from "@/components/EmployerPageShell";
import CompanyProfileCard from "@/pages/employer/JobPosting/components/CompanyProfileCard";
import JobPostingForm, {
  type JobFormState,
  type JobSubmitPayload,
} from "@/pages/employer/JobPosting/components/JobPostingForm";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteJob,
  getJobById,
  updateJob,
  type JobDetail,
  type JobCreateUpdatePayload,
} from "@/services/jobs";
import {
  getEmployerDashboard,
  getEmployerProfile,
  type EmployerProfileResponse,
} from "@/services/employerProfile";
import { toSubmitPayload } from "./utils";

const mapJobDetailToForm = (job: JobDetail): JobFormState => ({
  title: job.title,
  companyName: job.companyName ?? job.hr?.companyName ?? "",
  description: job.description ?? "",
  location: job.location ?? "",
  jobType: job.jobType ?? "",
  workArrangement: job.workArrangement ?? "",
  duration: job.duration ?? "",
  tags: job.tags?.map((tag) => tag.name) ?? [],
  minSalary: job.minSalary?.toString() ?? "",
  maxSalary: job.maxSalary?.toString() ?? "",
  application_deadline: job.application_deadline
    ? job.application_deadline.slice(0, 10)
    : "",
  email: job.email ?? "",
  phone_number: job.phone_number ?? "",
  other_contact_information: job.other_contact_information ?? "",
  requirements: job.requirements?.map((item) => item.text) ?? [],
  qualifications: job.qualifications?.map((item) => item.text) ?? [],
  responsibilities: job.responsibilities?.map((item) => item.text) ?? [],
  benefits: job.benefits?.map((item) => item.text) ?? [],
});

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const buildDiff = (
  original: JobSubmitPayload,
  next: JobSubmitPayload
): Partial<JobCreateUpdatePayload> => {
  const diff: Partial<JobCreateUpdatePayload> = {};

  if (next.title !== original.title) diff.title = next.title;
  if (next.description !== original.description) diff.description = next.description;
  if (next.location !== original.location) diff.location = next.location;
  if (next.jobType !== original.jobType) diff.jobType = next.jobType;
  if (next.workArrangement !== original.workArrangement) diff.workArrangement = next.workArrangement;
  if (next.duration !== original.duration) diff.duration = next.duration;
  if (next.minSalary !== original.minSalary) diff.minSalary = next.minSalary;
  if (next.maxSalary !== original.maxSalary) diff.maxSalary = next.maxSalary;
  if (next.application_deadline !== original.application_deadline) {
    diff.application_deadline = next.application_deadline;
  }

  const nextEmail = next.email ?? null;
  const prevEmail = original.email ?? null;
  if (nextEmail !== prevEmail) diff.email = nextEmail;

  if (next.phone_number !== original.phone_number) {
    diff.phone_number = next.phone_number;
  }

  const nextOther = next.other_contact_information ?? null;
  const prevOther = original.other_contact_information ?? null;
  if (nextOther !== prevOther) diff.other_contact_information = nextOther;

  if (!arraysEqual(original.requirements, next.requirements)) {
    diff.requirements = next.requirements;
  }
  if (!arraysEqual(original.qualifications, next.qualifications)) {
    diff.qualifications = next.qualifications;
  }
  if (!arraysEqual(original.responsibilities, next.responsibilities)) {
    diff.responsibilities = next.responsibilities;
  }
  if (!arraysEqual(original.benefits, next.benefits)) {
    diff.benefits = next.benefits;
  }
  if (!arraysEqual(original.tags, next.tags)) {
    diff.tags = next.tags;
  }

  return diff;
};

type EmployerDashboardData = Awaited<ReturnType<typeof getEmployerDashboard>>;

const JobEditPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const jobIdParam = jobId ?? "";
  const dashboardQueryKey = ["employer-dashboard", user?.id] as const;

  const {
    data: jobDetail,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["job-detail", jobIdParam],
    queryFn: () => getJobById(jobIdParam),
    enabled: !!jobId,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const {
    data: employerProfile,
    isLoading: employerProfileLoading,
    isError: employerProfileError,
  } = useQuery<EmployerProfileResponse>({
    queryKey: ["employer-profile", user?.id],
    queryFn: () => getEmployerProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const initialFormData = useMemo(
    () => (jobDetail ? mapJobDetailToForm(jobDetail) : undefined),
    [jobDetail]
  );

  const initialSubmitPayload = useMemo(
    () => (initialFormData ? toSubmitPayload(initialFormData) : undefined),
    [initialFormData]
  );

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<JobCreateUpdatePayload>) =>
      updateJob(jobIdParam, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-detail", jobIdParam] });
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
      toast.success("Job updated successfully");
      navigate("/employer");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update job";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation<
    Awaited<ReturnType<typeof deleteJob>>,
    unknown,
    void,
    { previousDashboard?: EmployerDashboardData }
  >({
    mutationFn: () => deleteJob(jobIdParam),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: dashboardQueryKey });
      const previousDashboard =
        queryClient.getQueryData<EmployerDashboardData>(dashboardQueryKey);

      if (previousDashboard?.dashboard?.myJobPostings) {
        queryClient.setQueryData(dashboardQueryKey, {
          ...previousDashboard,
          dashboard: {
            ...previousDashboard.dashboard,
            myJobPostings:
              previousDashboard.dashboard.myJobPostings.filter(
                (job) => job.id !== jobIdParam,
              ),
          },
        });
      }

      return { previousDashboard };
    },
    onError: (error: unknown, _variables, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(dashboardQueryKey, context.previousDashboard);
      }

      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete job";
      toast.error(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
      toast.success("Job deleted");
      navigate("/employer");
    },
  });

  const handleSave = async (
    payload: JobSubmitPayload,
    _form: JobFormState
  ) => {
    void _form;
    if (!jobId) {
      toast.error("Job identifier is missing");
      return;
    }
    if (!initialSubmitPayload) return;
    const diff = buildDiff(initialSubmitPayload, payload);
    if (Object.keys(diff).length === 0) {
      toast.info("No changes to save");
      return;
    }
    await updateMutation.mutateAsync(diff);
  };

  if (!jobId) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-semibold">Job not found</h1>
          <p className="text-muted-foreground">
            The requested job identifier is missing.
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <div className="fixed inset-0 -z-50 pointer-events-none bg-bg-1" />
        <main className="flex min-h-screen items-center justify-center p-8">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-semibold">Please sign in</h1>
            <p className="text-muted-foreground">
              You must be logged in to edit a job.
            </p>
          </div>
        </main>
      </>
    );
  }

  if (user.role !== "employer" && user.role !== "admin") {
    return (
      <>
        <div className="fixed inset-0 -z-50 pointer-events-none bg-bg-1" />
        <main className="flex min-h-screen items-center justify-center p-8">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-semibold">Access denied</h1>
            <p className="text-muted-foreground">
              Only employer (or admin) accounts can edit jobs.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <EmployerPageShell title="Edit Job">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-8 text-3xl font-bold text-accent">Edit Job</h1>
          <p className="text-muted-foreground">
            Update your job information and manage applicants.
          </p>
        </div>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/employer")}
                  >
                    ← Back to dashboard
                  </Button>
                  <h2 className="text-lg font-semibold text-foreground">
                    Job Information
                  </h2>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Delete Job"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete this job?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. Applicants and
                        related data will be removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        disabled={deleteMutation.isPending}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate()}
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <CompanyProfileCard
                userId={user.id}
                prefetchedProfile={employerProfile}
                loadingOverride={employerProfileLoading}
              />

              {employerProfileError && (
                <p className="mt-4 text-sm text-destructive">
                  Failed to load company profile. Retry later.
                </p>
              )}

              {isLoading ? (
                <div className="mt-8 space-y-4">
                  {[0, 1, 2].map((idx) => (
                    <Skeleton
                      key={idx}
                      className="h-16 w-full rounded-xl"
                    />
                  ))}
                </div>
              ) : isError || !initialFormData ? (
                <div className="mt-8 rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
                  Unable to load this job. It may have been removed.
                </div>
              ) : (
                <div className="mt-8">
                  <JobPostingForm
                    userId={user.id}
                    mode="edit"
                    initialData={initialFormData}
                    submitLabel="Save Changes"
                    onSubmit={handleSave}
                    prefetchedProfile={employerProfile}
                    profileLoading={employerProfileLoading}
                  />
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </EmployerPageShell>
  );
};

export default JobEditPage;
