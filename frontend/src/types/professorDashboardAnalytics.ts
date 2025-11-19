import type { ProfessorDashboardSummary } from "@/services/professor";

export type ProfessorDashboardAnalytics = ProfessorDashboardSummary;

export type CompanyInsight =
  ProfessorDashboardAnalytics["jobMetrics"]["topCompanies"][number];

export type JobTypeInsight =
  ProfessorDashboardAnalytics["jobMetrics"]["byJobType"][number];

export type DailyTrendPoint =
  ProfessorDashboardAnalytics["applicationTrends"]["daily"][number];

export type MonthlyTrendPoint =
  ProfessorDashboardAnalytics["applicationTrends"]["monthly"][number];
