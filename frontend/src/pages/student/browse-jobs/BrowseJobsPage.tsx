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
} from "@/services/jobs";

const PAGE_SIZE = 25;

const BrowseJobs = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [workArrangementFilter, setWorkArrangementFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [isDetailSheetOpen, setDetailSheetOpen] = useState(false);
  const [jobPendingApply, setJobPendingApply] = useState<JobResponse | null>(
    null
  );
  const [isSubmittingApplication, setSubmittingApplication] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

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

  const browseQuery = useQuery({
    queryKey: ["jobs", "list", jobFilters, PAGE_SIZE],
    queryFn: () => listJobs(jobFilters, 1, PAGE_SIZE),
    retry: false,
  });

  const savedQuery = useQuery({
    queryKey: ["jobs", "saved", PAGE_SIZE],
    queryFn: () => getSavedJobs(1, PAGE_SIZE),
    enabled: isAuthenticated,
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

  const jobs = useMemo(() => {
    if (activeTab === "saved") {
      if (savedJobsList.length) {
        return savedJobsList;
      }
      return browseJobs.filter((job) => savedJobs.has(job.id));
    }
    return browseJobs;
  }, [activeTab, browseJobs, savedJobsList, savedJobs]);

  const locationOptions = useMemo<SelectOption[]>(() => {
    const source = activeTab === "saved" ? jobs : browseJobs;

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
  }, [activeTab, jobs, browseJobs]);

  const displayedJobs = useMemo(() => {
    let result = [...jobs];

    if (activeTab === "saved" && !savedJobsList.length) {
      result = result.filter((job) => savedJobs.has(job.id));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((job) => {
        const title = job.title?.toLowerCase() ?? "";
        const company = job.companyName?.toLowerCase() ?? "";
        return title.includes(query) || company.includes(query);
      });
    }

    if (jobTypeFilter !== "all") {
      const typeFilter = jobTypeFilter.toLowerCase();
      result = result.filter(
        (job) => job.jobType?.toLowerCase() === typeFilter
      );
    }

    if (workArrangementFilter !== "all") {
      const arrangementFilter = workArrangementFilter.toLowerCase();
      result = result.filter(
        (job) => job.workArrangement?.toLowerCase() === arrangementFilter
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
    jobs,
    activeTab,
    savedJobs,
    savedJobsList,
    searchQuery,
    jobTypeFilter,
    workArrangementFilter,
    locationFilter,
    sortBy,
  ]);

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

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null;

  const savedCount = savedQuery.data?.total ?? savedJobs.size;

  const totalResults =
    activeTab === "saved"
      ? displayedJobs.length
      : browseQuery.data?.total ?? displayedJobs.length;

  const resultText =
    activeTab === "saved"
      ? `${totalResults} saved ${totalResults === 1 ? "job" : "jobs"}`
      : `${totalResults} ${totalResults === 1 ? "job" : "jobs"} found`;

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setJobTypeFilter("all");
    setWorkArrangementFilter("all");
    setLocationFilter("all");
    setSortBy("latest");
  }, []);

  const handleToggleSave = useCallback(
    async (jobId: string) => {
      try {
        const { isSaved } = await toggleSaveJob(jobId);
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
      }
    },
    [queryClient]
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
        jobs.find((job) => job.id === jobId) ??
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
    [appliedJobs, jobs, browseJobs, savedJobsList, isApplicationBusy]
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
      ? savedQuery.isLoading && !jobs.length
      : browseQuery.isLoading && !jobs.length;

  const isSelectedJobApplied =
    selectedJob && (appliedJobs.has(selectedJob.id) || selectedJob.isApplied);

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
        onTabChange={setActiveTab}
        onSearchChange={setSearchQuery}
        onJobTypeFilterChange={setJobTypeFilter}
        onLocationFilterChange={setLocationFilter}
        onWorkArrangementFilterChange={setWorkArrangementFilter}
        onClearFilters={handleClearFilters}
      />

      <main className="flex flex-1 overflow-hidden lg:grid lg:grid-cols-[420px_minmax(0,1fr)] lg:overflow-visible">
        <JobList
          displayedJobs={displayedJobs}
          resultText={resultText}
          isLoading={listIsLoading}
          selectedJobId={selectedJobId}
          savedJobs={savedJobs}
          activeTab={activeTab}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          onSelectJob={handleSelectJob}
          onToggleSave={handleToggleSave}
          onClearFilters={handleClearFilters}
        />

        <section className="hidden lg:flex lg:flex-1 lg:min-w-0">
          <div className="sticky top-0 flex h-screen w-full flex-col bg-card">
            <JobDetailView
              job={selectedJob}
              onApply={handleRequestApply}
              isApplied={Boolean(isSelectedJobApplied)}
              isApplying={isApplicationBusy}
            />
          </div>
        </section>

        {!isDesktop && selectedJob ? (
          <JobDetailSheet
            isDetailSheetOpen={isDetailSheetOpen}
            selectedJob={selectedJob}
            onOpenChange={setDetailSheetOpen}
            onClose={handleCloseDetailSheet}
            onApply={handleRequestApply}
            isApplied={Boolean(isSelectedJobApplied)}
            isApplying={isApplicationBusy}
          />
        ) : null}
      </main>

      <JobApplicationDialog
        job={jobPendingApply}
        open={Boolean(jobPendingApply)}
        onOpenChange={handleApplicationDialogChange}
        onApplied={handleApplicationSuccess}
        onSubmittingChange={(next) => setSubmittingApplication(next)}
      />
    </div>
  );
};

export default BrowseJobs;
