import { RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterOption = {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

interface FilterPanelProps {
  filters: FilterOption[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  summary: string;
  isRefreshing?: boolean;
  onExportCsv?: () => void;
  isExporting?: boolean;
}

const FilterPanel = ({
  filters,
  searchValue,
  onSearchChange,
  onRefresh,
  summary,
  isRefreshing,
  onExportCsv,
  isExporting,
}: FilterPanelProps) => {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary px-6 py-5 shadow-[0_12px_32px_rgba(17,24,39,0.08)] text-primary-foreground">
        <div className="grid gap-4 md:grid-cols-3">
          {filters.map((filter) => (
            <div key={filter.label} className="space-y-2">
              <div className="text-sm font-semibold">{filter.label}</div>
              <Select value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger className="h-12 rounded-full border-none bg-white text-primary shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:space-x-4">
          <div className="relative w-full flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search students by name, ID, or degree..."
              className="h-12 rounded-full border-none bg-white/95 pl-11 text-sm text-primary"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-3 py-2">
            <Button
              type="button"
              className="h-12 rounded-full bg-accent px-6 font-semibold text-white shadow-sm hover:bg-accent/80" 
              onClick={onExportCsv}
              disabled={isExporting}
            >
              {isExporting ? "Exporting…" : "Export filtered CSV"}
            </Button>
            <Button
              type="button"
              className="h-12 rounded-full border border-white/70 px-5 font-semibold text-white shadow-sm transition hover:bg-white/20 focus-visible:ring-white/50"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh data
            </Button>
          </div>
        </div>

        <p className="text-right text-xs text-primary-foreground/80">
          Export downloads the students currently filtered above.
        </p>
      </div>

      <p className="pl-2 text-xs text-muted-foreground">{summary}</p>
    </div>
  );
};

export default FilterPanel;
