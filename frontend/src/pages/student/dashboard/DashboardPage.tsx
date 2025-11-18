import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  getDashboardData,
  type DashboardData,
  type StudentDashboardData,
} from "@/services/dashboard";
import {
  DashboardErrorState,
  DashboardSkeleton,
  MyApplicationsCard,
  QuickActionGrid,
  RecentJobCard,
  StatsSummary,
  WelcomeHeader,
} from "./components";

const STUDENT_DASHBOARD_QUERY_KEY = ["dashboard", "student"] as const;

const StudentDashboardPage = () => {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<DashboardData, Error>({
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

    const segments = user.name.trim().split(/\s+/);
    return segments[0] || fallback;
  }, [user?.name]);

  if (isLoading && !data) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8">
        <DashboardSkeleton />
      </div>
    );
  }

  const isStudent = data?.userRole === "STUDENT";
  const dashboard = (isStudent
    ? (data?.dashboard as StudentDashboardData | undefined)
    : undefined) ?? {
    recentJobs: [],
    myApplications: [],
    quickActions: [],
  };

  if (isError || !isStudent) {
    const message =
      error?.message ??
      "We couldn’t load your student dashboard right now. Please try again.";

    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12 lg:px-8">
        <DashboardErrorState
          message={message}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const recentJobs = dashboard.recentJobs ?? [];
  const applications = dashboard.myApplications ?? [];
  const quickActions = dashboard.quickActions ?? [];

  return (
    <div className="relative min-h-[calc(100vh-var(--app-header-height,0px))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-95"
        style={{
          backgroundColor: "var(--color-bg-1)",
          backgroundImage:
            "radial-gradient(circle at 20% 25%, rgba(0, 102, 100, 0.16), transparent 55%), radial-gradient(circle at 85% 5%, rgba(178, 187, 30, 0.18), transparent 65%), linear-gradient(120deg, rgba(0, 102, 100, 0.04), rgba(178, 187, 30, 0.04))",
        }}
      />

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 lg:px-8">
        <WelcomeHeader firstName={firstName} timestamp={data?.timestamp} />

        <StatsSummary
          recentJobs={recentJobs.length}
          applications={applications.length}
          quickActions={quickActions.length || 4}
        />

        <QuickActionGrid quickActions={quickActions} />

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <RecentJobCard jobs={recentJobs} />
          <MyApplicationsCard applications={applications} />
        </div>

        {isFetching && !isLoading ? (
          <p className="text-sm text-muted-foreground">
            Refreshing dashboard…
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default StudentDashboardPage;
