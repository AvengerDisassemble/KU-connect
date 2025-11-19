import { useMemo } from "react";

import ProfessorLayout from "@/components/layout/ProfessorLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProfessorDashboardAnalytics } from "@/hooks/useProfessorDashboardAnalytics";
import KpiCards from "./components/KpiCards";
import TopCompaniesCard from "./components/TopCompaniesCard";
import JobTypeChart from "./components/JobTypeChart";
import TrendsChart from "./components/TrendsChart";
import TrendChartCard from "./components/TrendChartCard";
import SuccessDonutCard from "./components/SuccessDonutCard";

const ProfessorInsightsPage = () => {
  const { data, isLoading, error } = useProfessorDashboardAnalytics();

  const dailyTrend = useMemo(
    () => data?.applicationTrends.daily ?? [],
    [data?.applicationTrends.daily],
  );
  const monthlyTrend = useMemo(
    () => data?.applicationTrends.monthly ?? [],
    [data?.applicationTrends.monthly],
  );
  const jobMetrics = data?.jobMetrics;

  const qualifiedRateRaw = data?.summary?.qualifiedRate ?? 0;
  const normalizedQualifiedRate =
    qualifiedRateRaw > 1 ? qualifiedRateRaw / 100 : qualifiedRateRaw;

  const qualifiedShare = useMemo(() => {
    const status = data?.applicationMetrics?.byStatus;
    if (status) {
      const total = (status.qualified ?? 0) + (status.rejected ?? 0);
      if (total > 0) {
        return (status.qualified ?? 0) / total;
      }
    }
    return normalizedQualifiedRate;
  }, [data?.applicationMetrics?.byStatus, normalizedQualifiedRate]);

  const rechartsMonthly = useMemo(
    () =>
      monthlyTrend.map((point) => ({
        date: point.month,
        applications: point.applications,
        newJobs: point.newJobs,
      })),
    [monthlyTrend],
  );

  return (
    <ProfessorLayout
      title="Professor Insights"
      description="Track employer demand, student applications, and emerging trends."
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load analytics</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : null}

        <KpiCards
          activeJobPostings={jobMetrics?.activeJobPostings}
          newJobsThisMonth={jobMetrics?.thisMonth?.newJobs}
          percentChange={jobMetrics?.thisMonth?.percentChange}
          trend={jobMetrics?.thisMonth?.trend}
          isLoading={isLoading}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <TrendChartCard data={dailyTrend} isLoading={isLoading} />
          <SuccessDonutCard
            byStatus={data?.applicationMetrics?.byStatus}
            qualifiedRate={qualifiedShare}
            isLoading={isLoading}
          />
        </div>

        <div className="w-full">
          <TrendsChart
            data={rechartsMonthly}
            title="Monthly Applications vs New Jobs"
            isLoading={isLoading}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 h-80">
          <JobTypeChart jobTypes={jobMetrics?.byJobType} isLoading={isLoading} />
          <TopCompaniesCard companies={jobMetrics?.topCompanies} isLoading={isLoading} />
        </div>
      </div>
    </ProfessorLayout>
  );
};

export default ProfessorInsightsPage;
