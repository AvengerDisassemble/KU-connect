import { useQuery } from "@tanstack/react-query";

import { getProfessorDashboardAnalytics } from "@/services/professor";
import type { ProfessorDashboardAnalytics } from "@/types/professorDashboardAnalytics";

export const PROFESSOR_ANALYTICS_QUERY_KEY = ["professor-dashboard-analytics"];

export const useProfessorDashboardAnalytics = () => {
  const query = useQuery<ProfessorDashboardAnalytics>({
    queryKey: PROFESSOR_ANALYTICS_QUERY_KEY,
    queryFn: getProfessorDashboardAnalytics,
    staleTime: 60_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};
