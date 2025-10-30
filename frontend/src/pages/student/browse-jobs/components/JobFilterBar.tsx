import { useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { SelectOption } from "../types";

interface JobFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  jobTypeFilter: string;
  onJobTypeFilterChange: (value: string) => void;
  locationFilter: string;
  onLocationFilterChange: (value: string) => void;
  workArrangementFilter: string;
  onWorkArrangementFilterChange: (value: string) => void;
  locationOptions: SelectOption[];
  onClearFilters: () => void;
  activeFilters?: {
    jobType?: string;
    location?: string;
    workArrangement?: string;
  };
}

const jobTypeOptions: SelectOption[] = [
  { value: "all", label: "All job types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
];

const workArrangementOptions: SelectOption[] = [
  { value: "all", label: "All work styles" },
  { value: "onsite", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

// Sort options moved to JobList component

const JobFilterBar = ({
  searchQuery,
  onSearchChange,
  jobTypeFilter,
  onJobTypeFilterChange,
  locationFilter,
  onLocationFilterChange,
  workArrangementFilter,
  onWorkArrangementFilterChange,
  locationOptions,
  onClearFilters,
}: JobFilterBarProps) => {
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  const getFilterChipVariant = (currentValue: string, filterValue: string) => {
    const isActive = currentValue !== "all" && currentValue === filterValue;
    return isActive
      ? "bg-[var(--brand-teal)]/10 border-[var(--brand-teal)] text-[var(--brand-teal)] hover:bg-[var(--brand-teal)]/20"
      : "bg-[var(--neutral-bg-2)] border-gray-300 text-[var(--neutral-text-primary)] hover:bg-gray-50 hover:border-gray-400";
  };

  const getSelectedLabel = (options: SelectOption[], value: string) => {
    const option = options.find((opt) => opt.value === value);
    return option?.label || options[0]?.label || "Select";
  };

  const FilterChip = ({
    label,
    value,
    options,
    onChange,
    isActive,
  }: {
    label: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    isActive: boolean;
  }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "h-9 px-3 sm:px-4 rounded-md border font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 shadow-sm bg-[var(--neutral-bg-2)] whitespace-nowrap",
          getFilterChipVariant(value, isActive ? value : "")
        )}
      >
        <SelectValue placeholder={label}>
          {isActive ? getSelectedLabel(options, value) : label}
        </SelectValue>
      </SelectTrigger>

      <SelectContent
        className="min-w-[160px] sm:min-w-[200px] bg-white border border-gray-200 shadow-lg rounded-md p-2 z-50"
        position="popper"
        sideOffset={4}
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={cn(
              "rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
              value === option.value
                ? "bg-[var(--brand-teal)]/10 text-[var(--brand-teal)] font-medium"
                : "hover:bg-gray-100 text-[var(--neutral-text-primary)]"
            )}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const AdvancedFiltersSheet = () => (
    <Sheet open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
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
                        ? "bg-[var(--brand-teal)] hover:bg-[var(--brand-teal)]/90"
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
                        ? "bg-[var(--brand-teal)] hover:bg-[var(--brand-teal)]/90"
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
                    onClick={() => onWorkArrangementFilterChange(option.value)}
                    className={cn(
                      "rounded-full",
                      workArrangementFilter === option.value
                        ? "bg-[var(--brand-teal)] hover:bg-[var(--brand-teal)]/90"
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
            <Button
              variant="outline"
              onClick={() => {
                onClearFilters();
                setIsAdvancedFiltersOpen(false);
              }}
              className="flex-1"
            >
              Clear All
            </Button>
            <Button
              onClick={() => setIsAdvancedFiltersOpen(false)}
              className="flex-1 bg-[var(--brand-teal)] hover:bg-[var(--brand-teal)]/90"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  const hasActiveFilters =
    jobTypeFilter !== "all" ||
    locationFilter !== "all" ||
    workArrangementFilter !== "all";

  return (
    <div className="bg-[var(--neutral-bg-2)] border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          {/* Single row with search and filters */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {/* Search Input */}
            <div className="relative flex-shrink-0 w-full sm:w-auto sm:min-w-[280px] lg:min-w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search jobs, companies, or keywords"
                className="h-9 pl-10 pr-9 text-sm rounded-md border-gray-300 bg-white shadow-sm focus:border-[var(--brand-teal)] focus:ring-[var(--brand-teal)] focus:ring-1"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filter Chips - Horizontal Layout */}
            <div className="flex items-center gap-2 flex-nowrap flex-shrink-0">
              <FilterChip
                label="Job Type"
                value={jobTypeFilter}
                options={jobTypeOptions}
                onChange={onJobTypeFilterChange}
                isActive={jobTypeFilter !== "all"}
              />
              <FilterChip
                label="Location"
                value={locationFilter}
                options={locationOptions}
                onChange={onLocationFilterChange}
                isActive={locationFilter !== "all"}
              />
              <FilterChip
                label="Work Style"
                value={workArrangementFilter}
                options={workArrangementOptions}
                onChange={onWorkArrangementFilterChange}
                isActive={workArrangementFilter !== "all"}
              />
              <Button
                variant="outline"
                onClick={() => setIsAdvancedFiltersOpen(true)}
                className="h-9 px-3 rounded-md border border-gray-300 font-medium text-sm transition-all flex items-center gap-2 shadow-sm hover:border-gray-400 hover:bg-gray-50 flex-shrink-0"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 min-w-5 px-1.5 rounded-full bg-[var(--brand-lime)] text-white text-xs font-semibold"
                  >
                    {
                      [
                        jobTypeFilter,
                        locationFilter,
                        workArrangementFilter,
                      ].filter((f) => f !== "all").length
                    }
                  </Badge>
                )}
                <AdvancedFiltersSheet />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobFilterBar;
