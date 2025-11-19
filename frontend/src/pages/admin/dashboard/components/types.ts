import type { LucideIcon } from "lucide-react";

export type MetricCard = {
  key: string;
  title: string;
  value: number | string;
  subtext?: string;
  navigateTo?: string;
  icon: LucideIcon;
  accent: string;
};

export type DistributionItem = {
  label: string;
  value: number;
  percent: number;
};

export type AlertInfo = {
  label: string;
  value: number;
  navigateTo: string;
  icon: LucideIcon;
  accent: string;
};
