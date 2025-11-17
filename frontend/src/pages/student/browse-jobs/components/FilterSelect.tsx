import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterSelectProps } from "../types";

const FilterSelect = ({
  value,
  onValueChange,
  options,
  placeholder,
  triggerClassName,
}: FilterSelectProps) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className={triggerClassName}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent className="bg-popover border-border">
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default FilterSelect;
