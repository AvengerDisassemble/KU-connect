import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCcw,
  Users,
  BriefcaseBusiness,
  FileBadge2,
  ClipboardList,
  BellRing,
} from "lucide-react";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { getAdminDashboardStats } from "@/services/admin";
import type { AdminDashboardData } from "@/services/admin";
import StatsGrid from "./components/StatsGrid";
import OverviewPanel from "./components/OverviewPanel";
import TrendPanel from "./components/TrendPanel";
import ActivityColumn from "./components/ActivityColumn";
import type {
  MetricCard,
  DistributionItem,
  AlertInfo,
} from "./components/types";
import { formatNumber } from "./utils";

const buildMetricCards = (data?: AdminDashboardData): MetricCard[] => {
  if (!data) {
    return [
      {
        key: "users",
        title: "Total Users",
        value: "-",
        icon: Users,
        accent: "bg-emerald-100 text-emerald-700",
      },
    ];
  }

  return [
    {
      key: "users",
      title: "Total Users",
      value: formatNumber(data.users.total),
      subtext: `${formatNumber(data.users.growth.thisWeek)} new this week`,
      navigateTo: "/admin/users",
      icon: Users,
      accent: "bg-emerald-100 text-emerald-700",
    },
    {
      key: "jobs",
      title: "Active Jobs",
      value: formatNumber(data.jobs.active),
      subtext: `${formatNumber(data.jobs.growth.thisWeek)} posted this week`,
      navigateTo: "/admin/announcements",
      icon: BriefcaseBusiness,
      accent: "bg-sky-100 text-sky-600",
    },
    {
      key: "approvals",
      title: "Pending Approvals",
      value: formatNumber(data.alerts.pendingApprovals),
      navigateTo: "/admin/users?tab=pending",
      icon: ClipboardList,
      accent: "bg-amber-100 text-amber-600",
    },
    {
      key: "reports",
      title: "Unresolved Reports",
      value: formatNumber(data.alerts.unresolvedReports),
      navigateTo: "/admin/reports",
      icon: FileBadge2,
      accent: "bg-rose-100 text-rose-600",
    },
    {
      key: "announcements",
      title: "Total Announcements",
      value: formatNumber(data.announcements.total),
      navigateTo: "/admin/announcements",
      subtext: `${formatNumber(data.announcements.active)} active`,
      icon: BellRing,
      accent: "bg-indigo-100 text-indigo-600",
    },
  ];
};

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isFetching, refetch } = useQuery<AdminDashboardData>(
    {
      queryKey: ["admin", "dashboard"],
      queryFn: getAdminDashboardStats,
      refetchInterval: 30_000,
      refetchIntervalInBackground: true,
    }
  );

  const metricCards = useMemo(() => buildMetricCards(data), [data]);

  const roleDistribution = useMemo<DistributionItem[]>(() => {
    if (!data) return [];
    const { student, employer, professor, admin } = data.users.byRole;
    const total = student + employer + professor + admin || 1;
    return [
      {
        label: "Students",
        value: student,
        percent: Math.round((student / total) * 100),
      },
      {
        label: "Employers",
        value: employer,
        percent: Math.round((employer / total) * 100),
      },
      {
        label: "Professors",
        value: professor,
        percent: Math.round((professor / total) * 100),
      },
      {
        label: "Admins",
        value: admin,
        percent: Math.round((admin / total) * 100),
      },
    ];
  }, [data]);

  const statusDistribution = useMemo<DistributionItem[]>(() => {
    if (!data) return [];
    const { pending, approved, rejected, suspended } = data.users.byStatus;
    const total = pending + approved + rejected + suspended || 1;
    return [
      {
        label: "Approved",
        value: approved,
        percent: Math.round((approved / total) * 100),
      },
      {
        label: "Pending",
        value: pending,
        percent: Math.round((pending / total) * 100),
      },
      {
        label: "Rejected",
        value: rejected,
        percent: Math.round((rejected / total) * 100),
      },
      {
        label: "Suspended",
        value: suspended,
        percent: Math.round((suspended / total) * 100),
      },
    ];
  }, [data]);

  const applicationStatus = useMemo<DistributionItem[]>(() => {
    if (!data) return [];
    const { pending, qualified, rejected } = data.applications.byStatus;
    const total = pending + qualified + rejected || 1;
    return [
      {
        label: "Qualified",
        value: qualified,
        percent: Math.round((qualified / total) * 100),
      },
      {
        label: "Pending",
        value: pending,
        percent: Math.round((pending / total) * 100),
      },
      {
        label: "Rejected",
        value: rejected,
        percent: Math.round((rejected / total) * 100),
      },
    ];
  }, [data]);

  const registrationTrend = useMemo(
    () => data?.userRegistrationTrend ?? [],
    [data]
  );

  const alerts = useMemo<AlertInfo[]>(() => {
    if (!data) return [];
    return [
      {
        label: "Pending approvals",
        value: data.alerts.pendingApprovals,
        navigateTo: "/admin/users?tab=pending",
        icon: Users,
        accent: "bg-amber-500/10 text-amber-600",
      },
      {
        label: "Unresolved reports",
        value: data.alerts.unresolvedReports,
        navigateTo: "/admin/reports",
        icon: FileBadge2,
        accent: "bg-rose-500/10 text-rose-600",
      },
      {
        label: "Inactive jobs",
        value: data.alerts.inactiveJobs,
        navigateTo: "/admin/reports",
        icon: BriefcaseBusiness,
        accent: "bg-slate-500/10 text-slate-600",
      },
    ];
  }, [data]);

  const trendingJobs = data?.trending.jobs ?? [];
  const recentActivity = data?.recentActivity ?? [];

  const handleNavigate = useCallback(
    (path: string) => navigate(path),
    [navigate]
  );

  return (
    <AdminLayout
      title="Admin Dashboard"
      description="Monitor platform health, growth metrics, and pending actions."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCcw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      }
    >
      <StatsGrid
        cards={metricCards}
        isLoading={isLoading}
        onNavigate={handleNavigate}
      />

      <OverviewPanel
        isLoading={isLoading}
        roleDistribution={roleDistribution}
        statusDistribution={statusDistribution}
        applicationStatus={applicationStatus}
        jobsActive={data?.jobs.active}
        jobsGrowth={data?.jobs.growth.thisWeek}
        applicationsTotal={data?.applications.total}
        applicationsGrowth={data?.applications.growth.thisWeek}
        applicationsThisMonth={data?.applications.thisMonth}
      />

      <TrendPanel
        isLoading={isLoading}
        registrationTrend={registrationTrend}
        applicationStatus={applicationStatus}
      />

      <ActivityColumn
        isLoading={isLoading}
        alerts={alerts}
        recentActivity={recentActivity}
        trendingJobs={trendingJobs}
        announcements={data?.announcements}
        reports={data?.reports}
        onNavigate={handleNavigate}
      />
    </AdminLayout>
  );
};

export default AdminDashboardPage;
