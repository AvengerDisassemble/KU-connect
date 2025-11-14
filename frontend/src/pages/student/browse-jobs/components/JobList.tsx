import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface PaginationState {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

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
  pagination?: PaginationState;
  savingJobIds?: Set<string>;
  showSaveActions?: boolean;
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
  pagination,
  savingJobIds,
  showSaveActions = true,
}: JobListProps) => {
  const previousSortRef = useRef(sortBy);
  const isSorting = previousSortRef.current !== sortBy;

  useEffect(() => {
    previousSortRef.current = sortBy;
  }, [sortBy]);

  const sortOptions = [
    { value: "latest", label: "Latest" },
    { value: "deadline", label: "Deadline" },
    { value: "salary", label: "Highest salary" },
  ];

  const fallbackTotal = displayedJobs.length;
  const fallbackStart = fallbackTotal > 0 ? 1 : 0;
  const fallbackEnd = fallbackTotal;
  const fallbackIndicator = fallbackTotal > 0 ? "1 of 1" : "0 of 0";

  const rangeStart = pagination
    ? pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1
    : fallbackStart;
  const rangeEnd = pagination
    ? pagination.total === 0
      ? 0
      : Math.min(pagination.page * pagination.pageSize, pagination.total)
    : fallbackEnd;
  const rangeTotal = pagination ? pagination.total : fallbackTotal;
  const pageIndicator = pagination
    ? `${pagination.page} of ${pagination.pageCount}`
    : fallbackIndicator;

  const disableNav = isLoading || (pagination?.isFetching ?? false);
  const disablePrev =
    disableNav || !pagination || pagination.page <= 1 || pagination.total === 0;
  const disableNext =
    disableNav ||
    !pagination ||
    pagination.page >= pagination.pageCount ||
    pagination.total === 0;

  return (
    <div className="flex w-full flex-col border-r bg-card/40 lg:w-[420px] lg:max-w-[420px] lg:flex-none">
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

      <ScrollArea className="flex-1">
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
          ) : displayedJobs.length ? (
            <AnimatePresence mode="popLayout">
              {displayedJobs.map((job, index) => {
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
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/60 px-6 py-16 text-center">
              <Bookmark className="mb-4 h-10 w-10 text-muted-foreground/80" />
              <h3 className="text-lg font-semibold text-foreground">
                {activeTab === "saved"
                  ? "No saved jobs yet"
                  : "No matches found"}
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
      </ScrollArea>

      <div className="border-t px-4 py-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {rangeTotal === 0
              ? "0 of 0"
              : `${rangeStart} - ${rangeEnd} of ${rangeTotal}`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={disablePrev}
              onClick={() => pagination?.onPageChange(1)}
            >
              ‹‹
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={disablePrev}
              onClick={() =>
                pagination?.onPageChange((pagination?.page ?? 1) - 1)
              }
            >
              ‹
            </Button>
            <div className="px-3 py-0.5">{pageIndicator}</div>
            <Button
              variant="ghost"
              size="sm"
              disabled={disableNext}
              onClick={() =>
                pagination?.onPageChange((pagination?.page ?? 1) + 1)
              }
            >
              ›
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={disableNext}
              onClick={() =>
                pagination?.onPageChange(pagination?.pageCount ?? 1)
              }
            >
              ››
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobList;
