import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import ProfessorPageShell from "@/pages/professor/dashboard/components/ProfessorPageShell";
import { getProfessorDashboardAnalytics } from "@/services/professor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TrendChartCard from "./components/TrendChartCard";
import SuccessDonutCard from "./components/SuccessDonutCard";

const ProfessorAnalyticsPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["professor-analytics-dashboard"],
    queryFn: getProfessorDashboardAnalytics,
    staleTime: 60_000,
  });

  const dailyTrend = data?.applicationTrends.daily ?? [];
  const qualifiedRateRaw = data?.summary?.qualifiedRate ?? 0;
  const normalizedQualifiedRate =
    qualifiedRateRaw > 1 ? qualifiedRateRaw / 100 : qualifiedRateRaw;

  const qualifiedShare = useMemo(() => {
    const status = data?.applicationMetrics.byStatus;
    if (status) {
      const sum = (status.qualified ?? 0) + (status.rejected ?? 0);
      if (sum > 0) return (status.qualified ?? 0) / sum;
    }
    return normalizedQualifiedRate;
  }, [data?.applicationMetrics.byStatus, normalizedQualifiedRate]);

  return (
    <ProfessorPageShell title="Student Analytics Insights">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-poppins text-3xl font-semibold text-black py-2">
            Student Analytics Insights
          </h1>
          <p className="text-muted-foreground py-4">
            Monitor and analyze student job search activities and outcomes in real time.
          </p>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load analytics</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <TrendChartCard data={dailyTrend} isLoading={isLoading} />
          <SuccessDonutCard
            byStatus={data?.applicationMetrics.byStatus}
            qualifiedRate={qualifiedShare}
            isLoading={isLoading}
          />
        </div>
      </div>
    </ProfessorPageShell>
  );
};

export default ProfessorAnalyticsPage;
