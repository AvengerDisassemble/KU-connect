import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  JobFilters,
  JobList,
  JobDetailSheet,
  JobDetailView,
  JobApplicationDialog,
} from "./components";
import type { TabKey, SelectOption } from "./types";
import {
  getSavedJobs,
  listJobs,
  toggleSaveJob,
  type Job as JobResponse,
  type JobFilters as JobFiltersPayload,
  type JobListResponse,
} from "@/services/jobs";

const PAGE_SIZE = 15;

const BrowseJobs = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const isStudent = user?.role === "student";

  const [activeTab, setActiveTab] = useState<TabKey>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [workArrangementFilter, setWorkArrangementFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [savingJobIds, setSavingJobIds] = useState<Set<string>>(new Set());
  const [isDetailSheetOpen, setDetailSheetOpen] = useState(false);
  const [jobPendingApply, setJobPendingApply] = useState<JobResponse | null>(
    null
  );
  const [isSubmittingApplication, setSubmittingApplication] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  const normalizeWorkArrangement = (value?: string | null) =>
    value?.toLowerCase().replace(/[^a-z]/g, "") ?? "";

  const emptySetRef = useMemo(() => new Set<string>(), []);

  const jobFilters = useMemo<JobFiltersPayload>(() => {
    const filters: JobFiltersPayload = {};

    const trimmedSearch = searchQuery.trim();
    if (trimmedSearch) {
      filters.keyword = trimmedSearch;
    }

    if (jobTypeFilter !== "all") {
      filters.jobType = jobTypeFilter;
    }

    if (workArrangementFilter !== "all") {
      filters.workArrangement = workArrangementFilter;
    }

    if (locationFilter !== "all") {
      filters.location = locationFilter;
    }

    return filters;
  }, [searchQuery, jobTypeFilter, workArrangementFilter, locationFilter]);

  const browseQuery = useQuery<JobListResponse>({
    queryKey: ["jobs", "list", jobFilters, page, PAGE_SIZE],
    queryFn: () => listJobs({ ...jobFilters }, page, PAGE_SIZE),
    placeholderData: (previousData) => previousData,
    retry: false,
  });

  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [jobFilters, sortBy]);

  useEffect(() => {
    const data = browseQuery.data;
    if (!data) return;

    const limitValue = Math.max(1, data.limit ?? PAGE_SIZE);
    const totalValue = data.total ?? 0;
    const maxPage =
      totalValue > 0 ? Math.max(1, Math.ceil(totalValue / limitValue)) : 1;

    setPage((prev) => {
      const clamped = Math.min(Math.max(prev, 1), maxPage);
      return prev === clamped ? prev : clamped;
    });
  }, [browseQuery.data]);

  const savedQuery = useQuery({
    queryKey: ["jobs", "saved", user?.id ?? null, PAGE_SIZE],
    queryFn: () => {
      if (!user?.id) {
        throw new Error("Missing user ID");
      }
      return getSavedJobs(user.id, 1, PAGE_SIZE);
    },
    enabled: isStudent && isAuthenticated && Boolean(user?.id),
    retry: false,
  });

  useEffect(() => {
    if (!browseQuery.error) return;
    const message =
      browseQuery.error instanceof Error
        ? browseQuery.error.message
        : "Failed to load jobs.";
    toast.error(message);
  }, [browseQuery.error]);

  useEffect(() => {
    if (!savedQuery.error) return;
    const message =
      savedQuery.error instanceof Error
        ? savedQuery.error.message
        : "Failed to load saved jobs.";
    toast.error(message);
  }, [savedQuery.error]);

  useEffect(() => {
    if (!isStudent && activeTab !== "search") {
      setActiveTab("search");
    }
  }, [isStudent, activeTab]);

  const browseJobs = useMemo<JobResponse[]>(() => {
    const jobs = browseQuery.data?.jobs;
    return Array.isArray(jobs) ? (jobs as JobResponse[]) : [];
  }, [browseQuery.data]);

  const savedJobsList = useMemo<JobResponse[]>(() => {
    const jobs = savedQuery.data?.jobs;
    return Array.isArray(jobs) ? (jobs as JobResponse[]) : [];
  }, [savedQuery.data]);

  useEffect(() => {
    const nextSavedIds = new Set<string>();
    browseJobs.forEach((job) => {
      if (job.isSaved) nextSavedIds.add(job.id);
    });
    savedJobsList.forEach((job) => {
      if (job.isSaved !== false) nextSavedIds.add(job.id);
    });
    setSavedJobs(nextSavedIds);
  }, [browseJobs, savedJobsList]);

  useEffect(() => {
    setAppliedJobs((prev) => {
      const fromApi = new Set<string>();
      browseJobs.forEach((job) => {
        if (job.isApplied) fromApi.add(job.id);
      });
      savedJobsList.forEach((job) => {
        if (job.isApplied) fromApi.add(job.id);
      });

      if (!fromApi.size) {
        return prev;
      }

      const merged = new Set(fromApi);
      prev.forEach((id) => merged.add(id));
      return merged;
    });
  }, [browseJobs, savedJobsList]);

  const savedCombinedJobs = useMemo<JobResponse[]>(() => {
    if (savedJobsList.length) {
      return savedJobsList;
    }
    if (!savedJobs.size) {
      return [];
    }
    return browseJobs.filter((job) => savedJobs.has(job.id));
  }, [savedJobsList, browseJobs, savedJobs]);

  const filteredSavedJobs = useMemo<JobResponse[]>(() => {
    let result = [...savedCombinedJobs];

    const trimmedSearch = searchQuery.trim().toLowerCase();
    if (trimmedSearch) {
      result = result.filter((job) => {
        const title = job.title?.toLowerCase() ?? "";
        const company = job.companyName?.toLowerCase() ?? "";
        return title.includes(trimmedSearch) || company.includes(trimmedSearch);
      });
    }

    if (jobTypeFilter !== "all") {
      const typeFilter = jobTypeFilter.toLowerCase();
      result = result.filter(
        (job) => job.jobType?.toLowerCase() === typeFilter
      );
    }

    if (workArrangementFilter !== "all") {
      const arrangementFilter = normalizeWorkArrangement(workArrangementFilter);
      result = result.filter(
        (job) =>
          normalizeWorkArrangement(job.workArrangement) === arrangementFilter
      );
    }

    if (locationFilter !== "all") {
      const locationFilterLower = locationFilter.toLowerCase();
      result = result.filter(
        (job) => job.location?.toLowerCase() === locationFilterLower
      );
    }

    switch (sortBy) {
      case "latest":
        result.sort((a, b) => {
          const dateA = new Date(a.createdAt ?? 0).getTime();
          const dateB = new Date(b.createdAt ?? 0).getTime();
          return dateB - dateA;
        });
        break;
      case "salary":
        result.sort((a, b) => {
          const valueA = Number(a.maxSalary ?? a.minSalary ?? 0);
          const valueB = Number(b.maxSalary ?? b.minSalary ?? 0);
          return valueB - valueA;
        });
        break;
      case "deadline":
        result.sort((a, b) => {
          const deadlineA = a.application_deadline
            ? new Date(a.application_deadline).getTime()
            : Number.MAX_SAFE_INTEGER;
          const deadlineB = b.application_deadline
            ? new Date(b.application_deadline).getTime()
            : Number.MAX_SAFE_INTEGER;
          return deadlineA - deadlineB;
        });
        break;
      default:
        break;
    }

    return result;
  }, [
    savedCombinedJobs,
    searchQuery,
    jobTypeFilter,
    workArrangementFilter,
    locationFilter,
    sortBy,
  ]);

  const sortedBrowseJobs = useMemo<JobResponse[]>(() => {
    let result = [...browseJobs];

    if (workArrangementFilter !== "all") {
      const arrangementFilter = normalizeWorkArrangement(workArrangementFilter);
      result = result.filter(
        (job) =>
          normalizeWorkArrangement(job.workArrangement) === arrangementFilter
      );
    }

    switch (sortBy) {
      case "latest":
        result.sort((a, b) => {
          const dateA = new Date(a.createdAt ?? 0).getTime();
          const dateB = new Date(b.createdAt ?? 0).getTime();
          return dateB - dateA;
        });
        break;
      case "salary":
        result.sort((a, b) => {
          const valueA = Number(a.maxSalary ?? a.minSalary ?? 0);
          const valueB = Number(b.maxSalary ?? b.minSalary ?? 0);
          return valueB - valueA;
        });
        break;
      case "deadline":
        result.sort((a, b) => {
          const deadlineA = a.application_deadline
            ? new Date(a.application_deadline).getTime()
            : Number.MAX_SAFE_INTEGER;
          const deadlineB = b.application_deadline
            ? new Date(b.application_deadline).getTime()
            : Number.MAX_SAFE_INTEGER;
          return deadlineA - deadlineB;
        });
        break;
      default:
        break;
    }

    return result;
  }, [browseJobs, sortBy, workArrangementFilter]);

  const displayedJobs =
    activeTab === "saved" ? filteredSavedJobs : sortedBrowseJobs;

  const locationOptions = useMemo<SelectOption[]>(() => {
    const source = activeTab === "saved" ? savedCombinedJobs : browseJobs;

    const uniqueLocations = Array.from(
      new Set(
        source
          .map((job) => job.location?.trim())
          .filter((location): location is string => Boolean(location))
      )
    ).sort((a, b) => a.localeCompare(b));

    return [
      { value: "all", label: "All locations" },
      ...uniqueLocations.map((location) => ({
        value: location,
        label: location,
      })),
    ];
  }, [activeTab, savedCombinedJobs, browseJobs]);

  const pageSize = Math.max(1, browseQuery.data?.limit ?? PAGE_SIZE);
  const totalAvailable = browseQuery.data?.total ?? 0;
  const currentPageFromApi = Math.max(1, browseQuery.data?.page ?? page);
  const totalPages =
    totalAvailable > 0 ? Math.max(1, Math.ceil(totalAvailable / pageSize)) : 1;
  const isFetchingPage = browseQuery.isFetching && !browseQuery.isLoading;

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const maxPage = Math.max(1, totalPages);
      const normalized = Math.min(Math.max(1, Math.trunc(nextPage)), maxPage);
      setPage((prev) => (prev === normalized ? prev : normalized));
    },
    [totalPages]
  );

  const paginationState = useMemo(
    () =>
      activeTab === "saved"
        ? undefined
        : {
            page: currentPageFromApi,
            pageCount: totalPages,
            pageSize,
            total: totalAvailable,
            isFetching: isFetchingPage,
            onPageChange: handlePageChange,
          },
    [
      activeTab,
      currentPageFromApi,
      totalPages,
      pageSize,
      totalAvailable,
      isFetchingPage,
      handlePageChange,
    ]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setDetailSheetOpen(false);
      return;
    }

    setDetailSheetOpen(Boolean(selectedJobId));
  }, [isDesktop, selectedJobId]);

  useEffect(() => {
    if (!displayedJobs.length) {
      setSelectedJobId(null);
      return;
    }

    if (
      !selectedJobId ||
      !displayedJobs.some((job) => job.id === selectedJobId)
    ) {
      setSelectedJobId(displayedJobs[0].id);
    }
  }, [displayedJobs, selectedJobId]);

  const selectedJob =
    displayedJobs.find((job) => job.id === selectedJobId) ?? null;

  const savedCount = isStudent ? savedQuery.data?.total ?? savedJobs.size : 0;

  const visibleSavedJobs = isStudent ? savedJobs : emptySetRef;
  const visibleSavingJobs = isStudent ? savingJobIds : emptySetRef;

  const totalResults =
    activeTab === "saved" ? displayedJobs.length : totalAvailable;

  const resultText =
    activeTab === "saved"
      ? `${totalResults} saved ${totalResults === 1 ? "job" : "jobs"}`
      : `${totalResults} ${totalResults === 1 ? "job" : "jobs"} found`;

  const handleTabChange = useCallback(
    (value: TabKey) => {
      if (!isStudent && value === "saved") {
        return;
      }
      setActiveTab(value);
    },
    [isStudent]
  );

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setJobTypeFilter("all");
    setWorkArrangementFilter("all");
    setLocationFilter("all");
    setSortBy("latest");
  }, []);

  const handleToggleSave = useCallback(
    async (jobId: string) => {
      if (!isStudent) {
        return;
      }

      if (!user?.id) {
        toast.info("Please sign in to save jobs.");
        return;
      }

      let shouldSkip = false;
      setSavingJobIds((prev) => {
        if (prev.has(jobId)) {
          shouldSkip = true;
          return prev;
        }
        const next = new Set(prev);
        next.add(jobId);
        return next;
      });

      if (shouldSkip) {
        return;
      }

      const currentlySaved = savedJobs.has(jobId);

      try {
        const { isSaved } = await toggleSaveJob(user.id, jobId, currentlySaved);
        setSavedJobs((prev) => {
          const next = new Set(prev);
          if (isSaved) {
            next.add(jobId);
          } else {
            next.delete(jobId);
          }
          return next;
        });
        toast.success(
          isSaved ? "Job added to saved list." : "Job removed from saved list."
        );
        queryClient.invalidateQueries({ queryKey: ["jobs", "list"] });
        queryClient.invalidateQueries({ queryKey: ["jobs", "saved"] });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to update saved job.";
        toast.error(message);
      } finally {
        setSavingJobIds((prev) => {
          if (!prev.has(jobId)) {
            return prev;
          }
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      }
    },
    [isStudent, queryClient, savedJobs, user]
  );

  const isApplicationBusy = Boolean(jobPendingApply) || isSubmittingApplication;

  const handleRequestApply = useCallback(
    (jobId: string) => {
      if (!jobId) return;

      if (isApplicationBusy) {
        toast.info("Please wait for the current application to finish.");
        return;
      }

      if (appliedJobs.has(jobId)) {
        toast.info("You have already applied to this job.");
        return;
      }

      const jobFromList =
        displayedJobs.find((job) => job.id === jobId) ??
        browseJobs.find((job) => job.id === jobId) ??
        savedJobsList.find((job) => job.id === jobId) ??
        null;

      if (!jobFromList) {
        toast.error(
          "We could not find job details. Please refresh and try again."
        );
        return;
      }

      setJobPendingApply(jobFromList);
    },
    [appliedJobs, displayedJobs, browseJobs, savedJobsList, isApplicationBusy]
  );

  const handleApplicationSuccess = useCallback(
    (jobId: string) => {
      setAppliedJobs((prev) => {
        const next = new Set(prev);
        next.add(jobId);
        return next;
      });
      setJobPendingApply(null);
    },
    [setAppliedJobs, setJobPendingApply]
  );

  const handleApplicationDialogChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setJobPendingApply(null);
        setSubmittingApplication(false);
      }
    },
    [setJobPendingApply, setSubmittingApplication]
  );

  const handleSelectJob = useCallback(
    (jobId: string) => {
      setSelectedJobId(jobId);
      if (!isDesktop) {
        setDetailSheetOpen(true);
      }
    },
    [isDesktop]
  );

  const handleCloseDetailSheet = useCallback(() => {
    setDetailSheetOpen(false);
    setSelectedJobId(null);
  }, []);

  const listIsLoading =
    activeTab === "saved"
      ? savedQuery.isLoading && !savedCombinedJobs.length
      : browseQuery.isLoading && !browseQuery.data;

  const isSelectedJobApplied =
    selectedJob && (appliedJobs.has(selectedJob.id) || selectedJob.isApplied);
  const isSelectedJobSaved =
    isStudent && selectedJob ? savedJobs.has(selectedJob.id) : false;
  const isSelectedJobSaving =
    isStudent && selectedJob ? savingJobIds.has(selectedJob.id) : false;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <JobFilters
        activeTab={activeTab}
        searchQuery={searchQuery}
        jobTypeFilter={jobTypeFilter}
        locationFilter={locationFilter}
        workArrangementFilter={workArrangementFilter}
        locationOptions={locationOptions}
        savedCount={savedCount}
        onTabChange={handleTabChange}
        onSearchChange={setSearchQuery}
        onJobTypeFilterChange={setJobTypeFilter}
        onLocationFilterChange={setLocationFilter}
        onWorkArrangementFilterChange={setWorkArrangementFilter}
        onClearFilters={handleClearFilters}
        showSavedTab={isStudent}
      />

      <main className="flex flex-1 overflow-hidden lg:grid lg:grid-cols-[420px_minmax(0,1fr)] lg:overflow-visible">
        <JobList
          displayedJobs={displayedJobs}
          resultText={resultText}
          isLoading={listIsLoading}
          selectedJobId={selectedJobId}
          savedJobs={visibleSavedJobs}
          activeTab={activeTab}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          onSelectJob={handleSelectJob}
          onToggleSave={isStudent ? handleToggleSave : undefined}
          onClearFilters={handleClearFilters}
          pagination={paginationState}
          savingJobIds={visibleSavingJobs}
          showSaveActions={isStudent}
        />

        <section className="hidden lg:flex lg:flex-1 lg:min-w-0">
          <div className="sticky top-0 flex h-screen w-full flex-col bg-card">
            <JobDetailView
              job={selectedJob}
              onApply={isStudent ? handleRequestApply : undefined}
              isApplied={Boolean(isSelectedJobApplied)}
              isApplying={isApplicationBusy}
              onToggleSave={isStudent ? handleToggleSave : undefined}
              isSaved={isSelectedJobSaved}
              isSaving={isSelectedJobSaving}
            />
          </div>
        </section>

        {!isDesktop && selectedJob ? (
          <JobDetailSheet
            isDetailSheetOpen={isDetailSheetOpen}
            selectedJob={selectedJob}
            onOpenChange={setDetailSheetOpen}
            onClose={handleCloseDetailSheet}
            onApply={isStudent ? handleRequestApply : undefined}
            isApplied={Boolean(isSelectedJobApplied)}
            isApplying={isApplicationBusy}
            onToggleSave={isStudent ? handleToggleSave : undefined}
            isSaved={isSelectedJobSaved}
            isSaving={isSelectedJobSaving}
          />
        ) : null}
      </main>

      {isStudent ? (
        <JobApplicationDialog
          job={jobPendingApply}
          open={Boolean(jobPendingApply)}
          onOpenChange={handleApplicationDialogChange}
          onApplied={handleApplicationSuccess}
          onSubmittingChange={(next) => setSubmittingApplication(next)}
        />
      ) : null}
    </div>
  );
};

export default BrowseJobs;
