import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import AdvancedFiltersSheet from "./AdvancedFiltersSheet";
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
  { value: "on-site", label: "On-site" },
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

  return (
    <div className="bg-[var(--neutral-bg-2)] border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-3">
          {/* Single row with search and filters */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
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
              <AdvancedFiltersSheet
                open={isAdvancedFiltersOpen}
                onOpenChange={setIsAdvancedFiltersOpen}
                jobTypeFilter={jobTypeFilter}
                locationFilter={locationFilter}
                workArrangementFilter={workArrangementFilter}
                locationOptions={locationOptions}
                onJobTypeFilterChange={onJobTypeFilterChange}
                onLocationFilterChange={onLocationFilterChange}
                onWorkArrangementFilterChange={onWorkArrangementFilterChange}
                onClearFilters={onClearFilters}
                jobTypeOptions={jobTypeOptions}
                workArrangementOptions={workArrangementOptions}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobFilterBar;
