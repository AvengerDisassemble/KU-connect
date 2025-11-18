import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  WelcomeHeader,
  QuickActionGrid,
  StatsSummary,
  RecentJobsCard,
  MyApplicationsCard,
  DashboardSkeleton,
  DashboardErrorState,
} from "./components";
import {
  getDashboardData,
  type DashboardData,
  type StudentDashboardData,
} from "@/services/dashboard";

const STUDENT_DASHBOARD_QUERY_KEY = ["dashboard", "student"] as const;

const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<
    DashboardData,
    Error
  >({
    queryKey: STUDENT_DASHBOARD_QUERY_KEY,
    queryFn: getDashboardData,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const firstName = useMemo(() => {
    const fallback = "Student";
    if (!user?.name) {
      return fallback;
    }

    const parts = user.name.trim().split(/\s+/);
    return parts[0] || fallback;
  }, [user?.name]);

  if (isLoading && !data) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8">
        <DashboardSkeleton />
      </div>
    );
  }

  const isStudentDashboard = data?.userRole === "STUDENT";
  const dashboard = (isStudentDashboard
    ? (data?.dashboard as StudentDashboardData | undefined)
    : undefined) ?? { recentJobs: [], myApplications: [], quickActions: [] };

  if (isError || !isStudentDashboard) {
    const message =
      error?.message ??
      "We couldn’t load your student dashboard right now. Please try again.";

    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12 lg:px-8">
        <DashboardErrorState message={message} onRetry={() => void refetch()} />
      </div>
    );
  }

  const recentJobs = dashboard.recentJobs ?? [];
  const applications = dashboard.myApplications ?? [];
  const quickActions = dashboard.quickActions ?? [];
  const quickActionsCount = quickActions.length || 4;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 lg:px-8">
      <WelcomeHeader firstName={firstName} timestamp={data?.timestamp} />

      <StatsSummary
        availableJobs={recentJobs.length}
        applicationsSent={applications.length}
        quickActions={quickActionsCount}
      />

      <QuickActionGrid
        firstName={firstName}
        userId={user?.id}
        quickActions={quickActions}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentJobsCard jobs={recentJobs} />
        <MyApplicationsCard applications={applications} />
      </div>

      {isFetching && !isLoading ? (
        <p className="text-sm text-muted-foreground">Refreshing dashboard…</p>
      ) : null}
    </div>
  );
};

export default StudentDashboardPage;
