import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  JobFilters,
  JobList,
  JobDetailSheet,
  JobDetailView,
  JobApplicationDialog,
} from "./components";
import type { TabKey, SelectOption } from "./types";
import { isJobApplicationClosed } from "./utils";
import {
  getSavedJobs,
  getJobById,
  listJobs,
  toggleSaveJob,
  type Job as JobResponse,
  type JobDetail,
  type JobFilters as JobFiltersPayload,
} from "@/services/jobs";

const PAGE_SIZE = 15;
const MIN_SPINNER_DURATION = 200;
type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (
    this: MediaQueryList,
    listener: (event: MediaQueryListEvent) => void
  ) => void;
  removeListener?: (
    this: MediaQueryList,
    listener: (event: MediaQueryListEvent) => void
  ) => void;
};

const BrowseJobs = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const isStudent = user?.role === "student";
  const [searchParams, setSearchParams] = useSearchParams();
  const jobIdFromParams = searchParams.get("job");
  const searchParamValue = searchParams.get("search") ?? "";

  const [activeTab, setActiveTab] = useState<TabKey>("search");
  const [searchQuery, setSearchQueryState] = useState(searchParamValue);
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [workArrangementFilter, setWorkArrangementFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
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
  const [knownLocations, setKnownLocations] = useState<Set<string>>(
    () => new Set<string>()
  );
  const [showInfiniteSpinner, setShowInfiniteSpinner] = useState(false);
  const spinnerTimeoutRef = useRef<number | null>(null);
  const normalizeWorkArrangement = (value?: string | null) =>
    value?.toLowerCase().replace(/[^a-z]/g, "") ?? "";

  const emptySetRef = useMemo(() => new Set<string>(), []);

  useEffect(() => {
    setSearchQueryState((prev) =>
      prev === searchParamValue ? prev : searchParamValue
    );
  }, [searchParamValue]);

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

  const browseQuery = useInfiniteQuery({
    queryKey: ["jobs", "list", jobFilters, PAGE_SIZE],
    queryFn: ({ pageParam = 1 }) =>
      listJobs({ ...jobFilters }, pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage) => {
      const currentPage = Math.max(1, lastPage?.page ?? 1);
      const total = Math.max(0, lastPage?.total ?? 0);
      const limit = Math.max(1, lastPage?.limit ?? PAGE_SIZE);
      const totalPages = total ? Math.max(1, Math.ceil(total / limit)) : 1;
      const nextPage = currentPage + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
    staleTime: 60 * 1000,
    retry: false,
  });

  const firstPage = browseQuery.data?.pages?.[0];

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
    const pages = browseQuery.data?.pages;
    if (!pages?.length) {
      return [];
    }

    return pages.flatMap((page) =>
      Array.isArray(page?.jobs) ? (page.jobs as JobResponse[]) : []
    );
  }, [browseQuery.data]);

  const savedJobsList = useMemo<JobResponse[]>(() => {
    const jobs = savedQuery.data?.jobs;
    return Array.isArray(jobs) ? (jobs as JobResponse[]) : [];
  }, [savedQuery.data]);

  useEffect(() => {
    setKnownLocations((prev) => {
      const next = new Set(prev);
      let changed = false;

      const addLocation = (value?: string | null) => {
        const location = value?.trim();
        if (location && !next.has(location)) {
          next.add(location);
          changed = true;
        }
      };

      browseJobs.forEach((job) => addLocation(job.location));
      savedJobsList.forEach((job) => addLocation(job.location));

      return changed ? next : prev;
    });
  }, [browseJobs, savedJobsList]);

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
    const aggregate = new Set<string>();

    source.forEach((job) => {
      const location = job.location?.trim();
      if (location) aggregate.add(location);
    });

    knownLocations.forEach((location) => {
      if (location) aggregate.add(location);
    });

    if (locationFilter !== "all" && locationFilter.trim()) {
      aggregate.add(locationFilter.trim());
    }

    const sortedLocations = Array.from(aggregate).sort((a, b) =>
      a.localeCompare(b)
    );

    return [
      { value: "all", label: "All locations" },
      ...sortedLocations.map((location) => ({
        value: location,
        label: location,
      })),
    ];
  }, [
    activeTab,
    savedCombinedJobs,
    browseJobs,
    knownLocations,
    locationFilter,
  ]);

  const totalAvailableFromApi = firstPage?.total ?? 0;
  const hasMoreResults =
    activeTab === "search" && Boolean(browseQuery.hasNextPage);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = browseQuery;

  useEffect(() => {
    if (isFetchingNextPage) {
      if (spinnerTimeoutRef.current) {
        window.clearTimeout(spinnerTimeoutRef.current);
        spinnerTimeoutRef.current = null;
      }
      setShowInfiniteSpinner(true);
      return;
    }

    spinnerTimeoutRef.current = window.setTimeout(() => {
      setShowInfiniteSpinner(false);
      spinnerTimeoutRef.current = null;
    }, MIN_SPINNER_DURATION);

    return () => {
      if (spinnerTimeoutRef.current) {
        window.clearTimeout(spinnerTimeoutRef.current);
        spinnerTimeoutRef.current = null;
      }
    };
  }, [isFetchingNextPage]);

  useEffect(() => {
    if (!hasMoreResults || !sentinelNode) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }

        if (!hasNextPage || isFetchingNextPage || showInfiniteSpinner) {
          return;
        }

        fetchNextPage();
      },
      {
        root: null,
        rootMargin: "200px",
      }
    );

    observer.observe(sentinelNode);

    return () => {
      observer.disconnect();
    };
  }, [
    hasMoreResults,
    sentinelNode,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    showInfiniteSpinner,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const legacyMediaQuery = mediaQuery as LegacyMediaQueryList;

    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    legacyMediaQuery.addListener?.(handleChange);
    return () => legacyMediaQuery.removeListener?.(handleChange);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setDetailSheetOpen(false);
      return;
    }

    setDetailSheetOpen(Boolean(selectedJobId));
  }, [isDesktop, selectedJobId]);

  const syncJobSearchParam = useCallback(
    (jobId: string | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (jobId) {
          next.set("job", jobId);
        } else {
          next.delete("job");
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const handleSearchQueryChange = useCallback(
    (value: string) => {
      setSearchQueryState(value);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set("search", value);
        } else {
          next.delete("search");
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const handleLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    loadMoreRef.current = node;
    setSentinelNode(node);
  }, []);

  useEffect(() => {
    const isTabLoading =
      activeTab === "saved" ? savedQuery.isLoading : browseQuery.isLoading;

    if (!displayedJobs.length) {
      if (isTabLoading) {
        return;
      }

      setSelectedJobId(null);
      syncJobSearchParam(null);
      return;
    }

    const hasSelectedJob = selectedJobId
      ? displayedJobs.some((job) => job.id === selectedJobId)
      : false;

    if (isDesktop) {
      if (!hasSelectedJob) {
        const firstJobId = displayedJobs[0].id;
        setSelectedJobId(firstJobId);
        syncJobSearchParam(firstJobId);
      }
      return;
    }

    if (!hasSelectedJob && selectedJobId) {
      if (jobIdFromParams && selectedJobId === jobIdFromParams) {
        return;
      }
      setSelectedJobId(null);
      if (!jobIdFromParams) {
        syncJobSearchParam(null);
      }
    }
  }, [
    displayedJobs,
    selectedJobId,
    isDesktop,
    syncJobSearchParam,
    activeTab,
    savedQuery.isLoading,
    browseQuery.isLoading,
    jobIdFromParams,
  ]);

  useEffect(() => {
    if (!jobIdFromParams || jobIdFromParams === selectedJobId) {
      return;
    }

    const jobExists =
      displayedJobs.some((job) => job.id === jobIdFromParams) ||
      savedJobsList.some((job) => job.id === jobIdFromParams);

    if (!jobExists) {
      return;
    }

    setSelectedJobId(jobIdFromParams);
    if (!isDesktop) {
      setDetailSheetOpen(true);
    }
  }, [jobIdFromParams, selectedJobId, isDesktop, displayedJobs, savedJobsList]);

  const selectedJobListItem =
    displayedJobs.find((job) => job.id === selectedJobId) ?? null;

  const jobDetailQuery = useQuery<JobDetail>({
    queryKey: ["jobs", "detail", selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) {
        throw new Error("Missing job identifier");
      }
      return getJobById(selectedJobId);
    },
    enabled: Boolean(selectedJobId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!jobDetailQuery.error) {
      return;
    }
    const message =
      jobDetailQuery.error instanceof Error
        ? jobDetailQuery.error.message
        : "Unable to load job details.";
    toast.error(message);
  }, [jobDetailQuery.error]);

  const selectedJobDetail = jobDetailQuery.data ?? selectedJobListItem;
  const isJobDetailLoading =
    Boolean(selectedJobId) && jobDetailQuery.isFetching && !jobDetailQuery.data;

  const savedCount = isStudent ? savedQuery.data?.total ?? savedJobs.size : 0;

  const visibleSavedJobs = isStudent ? savedJobs : emptySetRef;
  const visibleSavingJobs = isStudent ? savingJobIds : emptySetRef;

  const searchResultsCount = totalAvailableFromApi || browseJobs.length;
  const totalResults =
    activeTab === "saved" ? displayedJobs.length : searchResultsCount;
  const spinnerVisible = activeTab === "search" && showInfiniteSpinner;

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
    handleSearchQueryChange("");
    setJobTypeFilter("all");
    setWorkArrangementFilter("all");
    setLocationFilter("all");
    setSortBy("latest");
  }, [handleSearchQueryChange]);

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

      if (isJobApplicationClosed(jobFromList)) {
        toast.info("Applications for this job are closed.");
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
      syncJobSearchParam(jobId);
      if (!isDesktop) {
        setDetailSheetOpen(true);
      }
    },
    [isDesktop, syncJobSearchParam]
  );

  const navigateJobSelection = useCallback(
    (direction: "next" | "prev") => {
      if (!displayedJobs.length) {
        return;
      }

      const currentIndex = selectedJobId
        ? displayedJobs.findIndex((job) => job.id === selectedJobId)
        : -1;

      if (
        direction === "next" &&
        currentIndex >= displayedJobs.length - 1 &&
        hasMoreResults &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }

      let nextIndex: number;
      if (direction === "next") {
        nextIndex =
          currentIndex < 0
            ? 0
            : Math.min(currentIndex + 1, displayedJobs.length - 1);
      } else {
        nextIndex =
          currentIndex < 0
            ? displayedJobs.length - 1
            : Math.max(currentIndex - 1, 0);
      }

      const nextJob = displayedJobs[nextIndex];
      if (!nextJob || nextJob.id === selectedJobId) {
        return;
      }

      handleSelectJob(nextJob.id);
    },
    [
      displayedJobs,
      selectedJobId,
      handleSelectJob,
      hasMoreResults,
      isFetchingNextPage,
      fetchNextPage,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        const role = target.getAttribute("role");
        if (
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select" ||
          tagName === "button" ||
          target.isContentEditable ||
          role === "combobox"
        ) {
          return;
        }
      }

      if (!displayedJobs.length) {
        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      event.preventDefault();
      navigateJobSelection(event.key === "ArrowDown" ? "next" : "prev");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayedJobs.length, navigateJobSelection]);

  const handleCloseDetailSheet = useCallback(() => {
    setDetailSheetOpen(false);
    setSelectedJobId(null);
    syncJobSearchParam(null);
  }, [syncJobSearchParam]);

  const isBrowseInitialLoading =
    browseQuery.isLoading || (browseQuery.isFetching && !browseJobs.length);

  const listIsLoading =
    activeTab === "saved"
      ? savedQuery.isLoading && !savedCombinedJobs.length
      : isBrowseInitialLoading;

  const isSelectedJobApplied =
    selectedJobListItem &&
    (appliedJobs.has(selectedJobListItem.id) || selectedJobListItem.isApplied);
  const isSelectedJobSaved =
    isStudent && selectedJobListItem
      ? savedJobs.has(selectedJobListItem.id)
      : false;
  const isSelectedJobSaving =
    isStudent && selectedJobListItem
      ? savingJobIds.has(selectedJobListItem.id)
      : false;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main
        className="
        flex flex-1 flex-col 
        lg:grid 
        lg:grid-rows-[auto_minmax(0,1fr)] 
        lg:grid-cols-[420px_minmax(0,1fr)] 
        lg:items-start 
        lg:overflow-visible
      "
      >
        {/* Filters row – full width */}
        <div className="lg:col-span-2">
          <JobFilters
            activeTab={activeTab}
            searchQuery={searchQuery}
            jobTypeFilter={jobTypeFilter}
            locationFilter={locationFilter}
            workArrangementFilter={workArrangementFilter}
            locationOptions={locationOptions}
            savedCount={savedCount}
            onTabChange={handleTabChange}
            onSearchChange={handleSearchQueryChange}
            onJobTypeFilterChange={setJobTypeFilter}
            onLocationFilterChange={setLocationFilter}
            onWorkArrangementFilterChange={setWorkArrangementFilter}
            onClearFilters={handleClearFilters}
            showSavedTab={isStudent}
          />
        </div>

        {/* Left Column: Job List */}
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
          isFetchingNextPage={isFetchingNextPage}
          loadMoreRef={handleLoadMoreRef}
          canLoadMore={hasMoreResults}
          savingJobIds={visibleSavingJobs}
          showSaveActions={isStudent}
          showSpinner={spinnerVisible}
          delayRender={spinnerVisible}
        />

        {/* Right Column: Sticky Job Detail (Desktop Only) */}
        <section className="hidden lg:block lg:sticky lg:top-0 lg:min-w-0 lg:flex-1">
          <div className="flex h-[100vh] w-full flex-col overflow-hidden  border border-border/60 bg-card shadow-md">
            <JobDetailView
              job={selectedJobDetail}
              onApply={isStudent ? handleRequestApply : undefined}
              isApplied={Boolean(isSelectedJobApplied)}
              isApplying={isApplicationBusy}
              onToggleSave={isStudent ? handleToggleSave : undefined}
              isSaved={isSelectedJobSaved}
              isSaving={isSelectedJobSaving}
              isLoadingDetail={isJobDetailLoading}
            />
          </div>
        </section>

        {/* Mobile Sheet */}
        {!isDesktop && selectedJobListItem && (
          <JobDetailSheet
            isDetailSheetOpen={isDetailSheetOpen}
            selectedJob={selectedJobDetail}
            onOpenChange={(open) => {
              setDetailSheetOpen(open);
              if (!open) {
                setSelectedJobId(null);
                syncJobSearchParam(null);
              }
            }}
            onClose={handleCloseDetailSheet}
            onApply={isStudent ? handleRequestApply : undefined}
            isApplied={Boolean(isSelectedJobApplied)}
            isApplying={isApplicationBusy}
            onToggleSave={isStudent ? handleToggleSave : undefined}
            isSaved={isSelectedJobSaved}
            isSaving={isSelectedJobSaving}
            isLoadingDetail={isJobDetailLoading}
          />
        )}
      </main>

      {/* Application Dialog */}
      {isStudent && (
        <JobApplicationDialog
          job={jobPendingApply}
          open={Boolean(jobPendingApply)}
          onOpenChange={handleApplicationDialogChange}
          onApplied={handleApplicationSuccess}
          onSubmittingChange={(next) => setSubmittingApplication(next)}
        />
      )}
    </div>
  );
};

export default BrowseJobs;
