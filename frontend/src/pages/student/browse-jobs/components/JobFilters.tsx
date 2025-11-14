import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobFilterBar from "./JobFilterBar";
import type { TabKey, SelectOption } from "../types";

interface JobFiltersProps {
  activeTab: TabKey;
  searchQuery: string;
  jobTypeFilter: string;
  locationFilter: string;
  workArrangementFilter: string;
  locationOptions: SelectOption[];
  savedCount: number;
  onTabChange: (value: TabKey) => void;
  onSearchChange: (value: string) => void;
  onJobTypeFilterChange: (value: string) => void;
  onLocationFilterChange: (value: string) => void;
  onWorkArrangementFilterChange: (value: string) => void;
  onClearFilters: () => void;
  showSavedTab?: boolean;
}

const JobFilters = ({
  activeTab,
  searchQuery,
  jobTypeFilter,
  locationFilter,
  workArrangementFilter,
  locationOptions,
  savedCount,
  onTabChange,
  onSearchChange,
  onJobTypeFilterChange,
  onLocationFilterChange,
  onWorkArrangementFilterChange,
  onClearFilters,
  showSavedTab = true,
}: JobFiltersProps) => {
  const selectedTab = showSavedTab ? activeTab : "search";

  return (
    <header className="bg-[var(--neutral-bg-2)] shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Header with Title and Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold text-primary tracking-tight">
              Jobs
            </h1>
            <Tabs
              value={selectedTab}
              onValueChange={(value) => onTabChange(value as TabKey)}
              className="hidden md:block"
            >
              <TabsList className="relative bg-gray-100 rounded-lg p-1">
                <TabsTrigger
                  value="search"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:translate-y-[-2px] data-[state=inactive]:opacity-70 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ease-out"
                >
                  Search
                </TabsTrigger>
                {showSavedTab ? (
                  <TabsTrigger
                    value="saved"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:translate-y-[-2px] data-[state=inactive]:opacity-70 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ease-out"
                  >
                    {savedCount ? `Saved (${savedCount})` : "Saved"}
                  </TabsTrigger>
                ) : null}
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-4"></div>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden mb-4">
          <Tabs
            value={selectedTab}
            onValueChange={(value) => onTabChange(value as TabKey)}
            className="w-full"
          >
            <TabsList className="bg-gray-100 rounded-lg p-1 w-full">
              <TabsTrigger
                value="search"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:translate-y-[-1px] data-[state=inactive]:opacity-70 rounded-md flex-1 px-3 py-2 text-sm font-medium transition-all duration-200 ease-out"
              >
                Search
              </TabsTrigger>
              {showSavedTab ? (
                <TabsTrigger
                  value="saved"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:translate-y-[-1px] data-[state=inactive]:opacity-70 rounded-md flex-1 px-3 py-2 text-sm font-medium transition-all duration-200 ease-out"
                >
                  {savedCount ? `Saved (${savedCount})` : "Saved"}
                </TabsTrigger>
              ) : null}
            </TabsList>
          </Tabs>
        </div>

        {/* New Filter Bar */}
        <JobFilterBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          jobTypeFilter={jobTypeFilter}
          onJobTypeFilterChange={onJobTypeFilterChange}
          locationFilter={locationFilter}
          onLocationFilterChange={onLocationFilterChange}
          workArrangementFilter={workArrangementFilter}
          onWorkArrangementFilterChange={onWorkArrangementFilterChange}
          locationOptions={locationOptions}
          onClearFilters={onClearFilters}
        />
      </div>
    </header>
  );
};

export default JobFilters;
