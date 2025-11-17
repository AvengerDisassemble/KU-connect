import { memo } from "react";
import { SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetPortal,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import type { SelectOption } from "../types";

interface AdvancedFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTypeFilter: string;
  locationFilter: string;
  workArrangementFilter: string;
  locationOptions: SelectOption[];
  onJobTypeFilterChange: (value: string) => void;
  onLocationFilterChange: (value: string) => void;
  onWorkArrangementFilterChange: (value: string) => void;
  onClearFilters: () => void;
  jobTypeOptions: SelectOption[];
  workArrangementOptions: SelectOption[];
}

const AdvancedFiltersSheet = memo(function AdvancedFiltersSheet({
  open,
  onOpenChange,
  jobTypeFilter,
  locationFilter,
  workArrangementFilter,
  locationOptions,
  onJobTypeFilterChange,
  onLocationFilterChange,
  onWorkArrangementFilterChange,
  onClearFilters,
  jobTypeOptions,
  workArrangementOptions,
}: AdvancedFiltersSheetProps) {
  const activeFiltersCount = [
    jobTypeFilter,
    locationFilter,
    workArrangementFilter,
  ].filter((filter) => filter !== "all").length;

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Button
        variant="outline"
        onClick={() => onOpenChange(true)}
        className="h-9 px-3 rounded-md border border-gray-300 font-medium text-sm transition-all flex items-center gap-2 shadow-sm hover:border-gray-400 flex-shrink-0"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <Badge
            variant="secondary"
            className="ml-1 h-5 min-w-5 px-1.5 rounded-full bg-[var(--brand-lime)] text-xs font-semibold"
          >
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      <SheetPortal forceMount>
        <SheetContent side="right" className="w-[400px] bg-white sm:max-w-md">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-lg font-semibold text-gray-900">
              Advanced Filters
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Job Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {jobTypeOptions.slice(1).map((option) => (
                    <Button
                      key={option.value}
                      variant={
                        jobTypeFilter === option.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => onJobTypeFilterChange(option.value)}
                      className={cn(
                        "rounded-full",
                        jobTypeFilter === option.value
                          ? "bg-accent hover:bg-accent/90"
                          : "border-gray-300 hover:border-gray-400"
                      )}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Location
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {locationOptions.slice(1).map((option) => (
                    <Button
                      key={option.value}
                      variant={
                        locationFilter === option.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => onLocationFilterChange(option.value)}
                      className={cn(
                        "rounded-full",
                        locationFilter === option.value
                          ? "bg-accent hover:bg-accent/90"
                          : "border-gray-300 hover:border-gray-400"
                      )}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Work Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {workArrangementOptions.slice(1).map((option) => (
                    <Button
                      key={option.value}
                      variant={
                        workArrangementFilter === option.value
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        onWorkArrangementFilterChange(option.value)
                      }
                      className={cn(
                        "rounded-full",
                        workArrangementFilter === option.value
                          ? "bg-accent hover:bg-accent/90"
                          : "border-gray-300 hover:border-gray-400"
                      )}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClearFilters}
                  className="flex-1"
                >
                  Clear All
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  type="button"
                  className="flex-1 bg-[var(--brand-teal)] text-white hover:bg-[var(--brand-teal)]/90"
                >
                  Apply Filters
                </Button>
              </SheetClose>
            </div>
          </div>
        </SheetContent>
      </SheetPortal>
    </Sheet>
  );
});

export default AdvancedFiltersSheet;
