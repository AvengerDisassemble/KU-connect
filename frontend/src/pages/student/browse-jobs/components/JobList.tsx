import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Bookmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TabKey, Job } from "../types";
import JobCard from "./JobCard";

interface JobListProps {
  displayedJobs: Job[];
  resultText: string;
  isLoading: boolean;
  selectedJobId: string | null;
  savedJobs: Set<string>;
  activeTab: TabKey;
  sortBy: string;
  onSelectJob: (jobId: string) => void;
  onToggleSave?: (jobId: string) => void;
  onClearFilters: () => void;
  onSortByChange: (value: string) => void;
  isFetchingNextPage?: boolean;
  loadMoreRef?: React.RefCallback<HTMLDivElement | null>;
  savingJobIds?: Set<string>;
  showSaveActions?: boolean;
  canLoadMore?: boolean;
  showSpinner?: boolean;
  delayRender?: boolean;
}

const JobList = ({
  displayedJobs,
  resultText,
  isLoading,
  selectedJobId,
  savedJobs,
  activeTab,
  sortBy,
  onSelectJob,
  onToggleSave,
  onClearFilters,
  onSortByChange,
  loadMoreRef,
  savingJobIds,
  showSaveActions = true,
  canLoadMore = false,
  showSpinner = false,
  delayRender = false,
}: JobListProps) => {
  const [renderedJobs, setRenderedJobs] = useState<Job[]>(displayedJobs);
  const [pendingJobs, setPendingJobs] = useState<Job[] | null>(null);
  const previousSortRef = useRef(sortBy);
  const isSorting = previousSortRef.current !== sortBy;
  const prevJobsLengthRef = useRef(displayedJobs.length);
  const prevSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    previousSortRef.current = sortBy;
  }, [sortBy]);

  useEffect(() => {
    const prevLength = prevJobsLengthRef.current;
    const nextLength = displayedJobs.length;
    const appended = nextLength > prevLength;

    if (appended && prevLength > 0) {
      setPendingJobs(displayedJobs);
    } else {
      setPendingJobs(null);
      setRenderedJobs(displayedJobs);
    }

    prevJobsLengthRef.current = nextLength;
  }, [displayedJobs]);

  useEffect(() => {
    if (!pendingJobs || delayRender) {
      return;
    }
    setRenderedJobs(pendingJobs);
    setPendingJobs(null);
  }, [pendingJobs, delayRender]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!selectedJobId || prevSelectedRef.current === selectedJobId) {
      prevSelectedRef.current = selectedJobId;
      return;
    }

    prevSelectedRef.current = selectedJobId;

    const rafId = window.requestAnimationFrame(() => {
      const escapedId = window.CSS?.escape?.(selectedJobId) ?? selectedJobId;
      const selector = `[data-job-id="${escapedId}"]`;
      const element = document.querySelector<HTMLElement>(selector);

      if (!element) {
        return;
      }

      element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [selectedJobId, renderedJobs]);

  const sortOptions = [
    { value: "latest", label: "Latest" },
    { value: "deadline", label: "Deadline" },
    { value: "salary", label: "Highest salary" },
  ];

  return (
    <div className="relative flex w-full flex-col bg-background  shadow-sm lg:w-[420px] lg:max-w-[420px] lg:flex-none lg:border lg:border-border/60">
      <div className="border-b bg-muted/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="font-medium text-sm text-gray-600">
              {resultText}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="h-8 min-w-[140px] rounded-md border border-border bg-white px-3 text-sm font-medium shadow-sm focus:ring-1 focus:ring-[var(--brand-teal)]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent align="end" className="min-w-[180px]">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 py-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="border border-border/60">
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : renderedJobs.length ? (
          <>
            <AnimatePresence mode="popLayout">
              {renderedJobs.map((job, index) => {
                const isSaved = savedJobs.has(job.id);
                const isSelected = job.id === selectedJobId;
                const isSaving = savingJobIds?.has(job.id) ?? false;

                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSelected={isSelected}
                    isSaved={isSaved}
                    onSelectJob={onSelectJob}
                    onToggleSave={onToggleSave}
                    index={index}
                    isSorting={isSorting}
                    canSave={showSaveActions}
                    isSaving={isSaving}
                  />
                );
              })}
            </AnimatePresence>

            {/* Load more sentinel - only show for search tab */}
            {activeTab === "search" && canLoadMore && (
              <>
                {showSpinner && (
                  <div className="flex justify-center py-4">
                    <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background/95 px-4 py-2 text-sm text-muted-foreground shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading more jobs…</span>
                    </div>
                  </div>
                )}
                <div className="py-2">
                  <div ref={loadMoreRef ?? undefined} className="h-1 w-full" />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/60 px-6 py-16 text-center">
            <Bookmark className="mb-4 h-10 w-10 text-muted-foreground/80" />
            <h3 className="text-lg font-semibold text-foreground">
              {activeTab === "saved" ? "No saved jobs yet" : "No matches found"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeTab === "saved"
                ? "Tap the bookmark icon on any job to keep it here."
                : "Try adjusting your filters or clearing your search to see more roles."}
            </p>
            {activeTab !== "saved" && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={onClearFilters}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobList;
