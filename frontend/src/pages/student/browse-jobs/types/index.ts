export type { Job } from "@/services/jobs";

export type TabKey = "search" | "saved";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  triggerClassName: string;
}
