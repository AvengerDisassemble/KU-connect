import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { RoleFilterValue } from "../types";

interface RoleOption {
  value: RoleFilterValue;
  label: string;
}

interface UserFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearch: () => void;
  role: RoleFilterValue;
  onRoleChange: (value: RoleFilterValue) => void;
  roleOptions: RoleOption[];
  total: number;
  isFetching: boolean;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
  role,
  onRoleChange,
  roleOptions,
  total,
  isFetching,
}) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="grid w-full gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Search
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Search by name or email"
            />
            <Button variant="secondary" size="icon" onClick={onSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Role
          </label>
          <Select value={role} onValueChange={(value) => onRoleChange(value as RoleFilterValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <span>{total} users</span>
      </div>
    </div>
  );
};

export default UserFilters;
