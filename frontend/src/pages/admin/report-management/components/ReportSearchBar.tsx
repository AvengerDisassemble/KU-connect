import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ReportSearchBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const ReportSearchBar: React.FC<ReportSearchBarProps> = ({
  searchTerm,
  onSearchTermChange,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Reported Jobs</h3>
        <p className="text-sm text-muted-foreground">
          Investigate reported job postings and coordinate with HR teams.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          className="h-9 w-full sm:w-[280px]"
          placeholder="Search by job, reporter, or reason"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
        />
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default ReportSearchBar;
