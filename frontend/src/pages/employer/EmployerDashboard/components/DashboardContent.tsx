"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import DashboardHeader from "./DashboardHeader";
import NotificationBanner from "./NotificationBanner";
import StatCard from "./StatCard";
import JobCard from "./JobCard";
import ApplicantRow from "./ApplicantRow";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuth } from "@/hooks/useAuth";
import {
  getEmployerProfile,
  type EmployerProfileResponse,
} from "@/services/employerProfile";
import {
  listJobs,
  getJobApplicants,
  manageApplication,
  type JobListResponse,
  type JobApplication,
} from "@/services/jobs";

type JobCardViewModel = {
  id: string;
  title: string;
  location: string;
  postedDate: string;
  status: "open" | "closed";
  applicants: number;
  shortlisted: number;
};

type ApplicantRecord = {
  id: string;
  name: string;
  email?: string | null;
  degree?: string | null;
  submittedAt: string;
  status: JobApplication["status"];
  jobId: string;
  jobTitle: string;
  application: JobApplication;
};

type AggregateStats = {
  total: number;
  qualified: number;
  newToday: number;
  newThisWeek: number;
};

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toBangkokDate = (value: string | Date): Date => {
  const src = typeof value === "string" ? new Date(value) : new Date(value);
  return new Date(src.getTime() + BANGKOK_OFFSET_MS);
};

const isSameThaiDay = (isoDate: string, reference = new Date()): boolean => {
  const created = toBangkokDate(isoDate);
  const ref = toBangkokDate(reference);

  return (
    created.getUTCFullYear() === ref.getUTCFullYear() &&
    created.getUTCMonth() === ref.getUTCMonth() &&
    created.getUTCDate() === ref.getUTCDate()
  );
};

const isThaiDateInCurrentWeek = (isoDate: string, reference = new Date()): boolean => {
  const created = toBangkokDate(isoDate);
  const ref = toBangkokDate(reference);

  const dayOfWeek = ref.getUTCDay();
  const diffToMonday = (dayOfWeek + 6) % 7;

  const currentMonday = new Date(ref.getTime());
  currentMonday.setUTCHours(0, 0, 0, 0);
  currentMonday.setUTCDate(currentMonday.getUTCDate() - diffToMonday);

  const nextMonday = new Date(currentMonday.getTime() + DAY_IN_MS * 7);

  return created >= currentMonday && created < nextMonday;
};

const formatRelativeDate = (iso: string, now = new Date()): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown";

  const diff = now.getTime() - date.getTime();
  if (diff < 0) return "just now";

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString();
};

const mapJobToViewModel = (
  job: JobListResponse["items"][number],
  applicantsCache: JobApplication[] | undefined
): JobCardViewModel => {
  const total = applicantsCache?.length ?? 0;
  const shortlisted =
    applicantsCache?.filter((app) => app.status === "QUALIFIED").length ?? 0;

  const isOpen =
    new Date(job.application_deadline).getTime() >= Date.now()
      ? "open"
      : "closed";

  return {
    id: job.id,
    title: job.title,
    location: job.location,
    postedDate: formatRelativeDate(job.createdAt),
    status: isOpen,
    applicants: total,
    shortlisted,
  };
};

const computeAggregateStats = (records: ApplicantRecord[]): AggregateStats => {
  if (!records.length) {
    return { total: 0, qualified: 0, newToday: 0, newThisWeek: 0 };
  }

  return records.reduce<AggregateStats>(
    (acc, record) => {
      if (record.status === "QUALIFIED") {
        acc.qualified += 1;
      }

      if (isSameThaiDay(record.submittedAt)) {
        acc.newToday += 1;
      }

      if (isThaiDateInCurrentWeek(record.submittedAt)) {
        acc.newThisWeek += 1;
      }

      acc.total += 1;
      return acc;
    },
    { total: 0, qualified: 0, newToday: 0, newThisWeek: 0 }
  );
};

const EmployerDashboardContent = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery<EmployerProfileResponse>({
    queryKey: ["employer-profile", user?.id],
    queryFn: () => getEmployerProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const hrId: string | undefined = profile?.hr?.id;

  const {
    data: jobList,
    isLoading: jobsLoading,
    isError: jobsError,
    refetch: refetchJobs,
    isRefetching: jobsRefetching,
  } = useQuery<JobListResponse>({
    queryKey: ["employer-jobs"],
    queryFn: () => listJobs(),
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const filteredJobs = useMemo<JobListResponse["items"][number][]>(() => {
    if (!jobList?.items) return [];
    if (!hrId) return [];
    return jobList.items.filter((job) => job.hrId === hrId);
  }, [jobList, hrId]);

  const jobIds = useMemo<string[]>(
    () => filteredJobs.map((job) => job.id).sort(),
    [filteredJobs]
  );

  const {
    data: applicantsByJob,
    isLoading: applicantsLoadingAll,
    isError: applicantsErrorAll,
    refetch: refetchAllApplicants,
    isFetching: applicantsFetching,
  } = useQuery<Record<string, JobApplication[]>>({
    queryKey: ["employer-all-applicants", jobIds],
    enabled: !!hrId && jobIds.length > 0,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      const entries: Array<[string, JobApplication[]]> = [];
      for (const jobId of jobIds) {
        try {
          const apps = await getJobApplicants(jobId);
          entries.push([jobId, apps]);
        } catch (error) {
          console.error("Failed to load applicants for job", jobId, error);
          entries.push([jobId, []]);
        }
      }
      return Object.fromEntries(entries);
    },
  });

  const manageMutation = useMutation({
    mutationFn: ({
      jobId,
      applicationId,
      status,
    }: {
      jobId: string;
      applicationId: string;
      status: "QUALIFIED" | "REJECTED";
    }) =>
      manageApplication(jobId, {
        applicationId,
        status,
      }),
    onSuccess: (_, variables) => {
      toast.success(`Application ${variables.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ["employer-all-applicants"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update applicant";
      toast.error(message);
    },
  });

  useEffect(() => {
    if (!filteredJobs.length) {
      setSelectedJobId(null);
      return;
    }

    setSelectedJobId((prev) => {
      if (prev && filteredJobs.some((job) => job.id === prev)) {
        return prev;
      }
      return null;
    });
  }, [filteredJobs]);

  const jobCards: JobCardViewModel[] = filteredJobs.map((job) =>
    mapJobToViewModel(job, applicantsByJob?.[job.id])
  );

  const selectedJob = filteredJobs.find((job) => job.id === selectedJobId);

  const allApplicantRecords = useMemo<ApplicantRecord[]>(() => {
    if (!filteredJobs.length) {
      return [];
    }

    return filteredJobs.flatMap((job) => {
      const apps = applicantsByJob?.[job.id] ?? [];
      return apps.map((app) => {
        const userInfo = app.student?.user;
        const name =
          [userInfo?.name, userInfo?.surname].filter(Boolean).join(" ") ||
          "Unknown applicant";
        return {
          id: app.id,
          name,
          email: userInfo?.email ?? null,
          degree: app.student?.degreeType?.name ?? null,
          submittedAt: app.createdAt,
          status: app.status,
          jobId: job.id,
          jobTitle: job.title,
          application: app,
        } satisfies ApplicantRecord;
      });
    });
  }, [filteredJobs, applicantsByJob]);

  const applicantsForSelection = useMemo<ApplicantRecord[]>(() => {
    if (!selectedJobId) {
      return allApplicantRecords;
    }

    return allApplicantRecords.filter((record) => record.jobId === selectedJobId);
  }, [allApplicantRecords, selectedJobId]);

  const hasSearch = searchQuery.trim().length > 0;

  const visibleApplicants = useMemo<ApplicantRecord[]>(() => {
    if (!hasSearch) {
      return applicantsForSelection;
    }

    const q = searchQuery.trim().toLowerCase();
    return applicantsForSelection.filter((record) => {
      return [
        record.name,
        record.email ?? "",
        record.degree ?? "",
        record.jobTitle,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q));
    });
  }, [applicantsForSelection, hasSearch, searchQuery]);

  const aggregateStats = useMemo(
    () => computeAggregateStats(allApplicantRecords),
    [allApplicantRecords]
  );

  const stats = {
    openJobs: jobCards.filter((job) => job.status === "open").length,
    newApplicationsToday: aggregateStats.newToday,
    offersMade: aggregateStats.qualified,
  };

  const handleViewApplicants = (jobId: string): void => {
    setSelectedJobId((prev) => (prev === jobId ? null : jobId));
  };

  const handleEditJob = (jobId: string): void => {
    navigate(`/employer/job-postings/${jobId}/edit`);
  };

  const loadingJobs = profileLoading || jobsLoading;
  const showJobsError = !loadingJobs && (profileError || jobsError);

  return (
    <div className="mx-auto w-full max-w-6xl px-2 sm:px-4">
      <DashboardHeader
        onPostJob={() => navigate("/employer/job-postings/create")}
      />

      <NotificationBanner newApplications={aggregateStats.newThisWeek} />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
        <StatCard label="Open Jobs" value={stats.openJobs} />
        <StatCard
          label="New Applications Today"
          value={stats.newApplicationsToday}
        />
        <StatCard label="Offers Made" value={stats.offersMade} />
      </div>

      {showJobsError ? (
        <div className="mb-6 rounded-2xl border border-dashed border-destructive/60 bg-destructive/5 p-6 text-sm text-destructive">
          <p className="mb-2 font-semibold">Unable to load your jobs.</p>
          <Button
            variant="outline"
            onClick={() => {
              void refetchJobs();
            }}
            disabled={jobsRefetching}
            className="inline-flex items-center gap-2 border-destructive text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card className="overflow-hidden rounded-2xl border-0 shadow-md">
            <div className="flex items-center justify-between border-b border-border p-6">
              <h2 className="text-xl font-bold">My Open Jobs</h2>
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-3 text-sm font-semibold text-white">
                {filteredJobs.length}
              </span>
            </div>

            {loadingJobs ? (
              <div className="space-y-4 p-6">
                {[0, 1, 2].map((idx) => (
                  <Skeleton key={idx} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {jobCards.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    variant="list"
                    onViewApplicants={handleViewApplicants}
                    onEditJob={handleEditJob}
                  />
                ))}
                {!jobCards.length && (
                  <div className="p-6 text-sm text-muted-foreground">
                    No jobs published yet. Create your first posting to see it here.
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="overflow-hidden rounded-2xl border-0 p-0 shadow-md">
            <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">Applicants Inbox</h2>
                {selectedJob ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedJob.title}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Showing applicants across all your jobs.
                  </p>
                )}
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search applicants"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={!filteredJobs.length || applicantsFetching}
                />
              </div>
            </div>

            {!filteredJobs.length ? (
              <div className="p-6 text-sm text-muted-foreground">
                Publish a job posting to start receiving applications.
              </div>
            ) : applicantsLoadingAll ? (
              <div className="space-y-3 p-6">
                {[0, 1, 2].map((idx) => (
                  <Skeleton key={idx} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : applicantsErrorAll ? (
              <div className="flex flex-col gap-3 p-6 text-sm text-destructive">
                <p>Unable to load applicants.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    void refetchAllApplicants();
                  }}
                  disabled={applicantsFetching}
                  className="inline-flex w-fit items-center gap-2 border-destructive text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : visibleApplicants.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                {hasSearch
                  ? "No applicants match your current filters."
                  : selectedJobId
                  ? "No applications for this job yet."
                  : "No applications received yet."}
              </div>
            ) : (
              <div className="px-4 pb-6 sm:px-6">
                <div className="space-y-2">
                  <div className="overflow-hidden rounded-lg border border-border bg-[var(--neutral-bg-1)]">
                    <table className="min-w-full table-fixed border-collapse text-left text-xs font-semibold uppercase text-[var(--neutral-text-secondary)]">
                      <colgroup>
                        <col className="w-[38%]" />
                        <col className="w-[32%]" />
                        <col className="w-[20%]" />
                        <col className="w-[10%]" />
                      </colgroup>
                      <thead>
                        <tr className="h-10">
                          <th className="px-4">Applicant</th>
                          <th className="px-4">Job</th>
                          <th className="px-4 text-right">Submitted</th>
                          <th className="px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                    </table>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="min-w-full table-fixed border-collapse text-sm text-foreground">
                      <colgroup>
                        <col className="w-[38%]" />
                        <col className="w-[32%]" />
                        <col className="w-[20%]" />
                        <col className="w-[10%]" />
                      </colgroup>
                      <tbody className="align-top">
                        {visibleApplicants.map((record) => (
                          <ApplicantRow
                            key={record.id}
                            application={record.application}
                            jobTitle={record.jobTitle}
                            decisionPending={manageMutation.isPending}
                            onDecision={(applicationId, status) => {
                              void manageMutation.mutateAsync({
                                jobId: record.jobId,
                                applicationId,
                                status,
                              });
                            }}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {applicantsFetching && !applicantsLoadingAll && (
              <div className="px-6 pb-4 text-xs text-muted-foreground">
                Refreshing applicants…
              </div>
            )}
          </Card>
        </div>
      </div>

      {jobsRefetching && (
        <div className="mt-4 text-xs text-muted-foreground">
          Refreshing jobs…
        </div>
      )}
    </div>
  );
};

export default EmployerDashboardContent;
