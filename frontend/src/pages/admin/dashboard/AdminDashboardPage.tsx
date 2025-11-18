import { memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCcw,
  ArrowRight,
  Users,
  BriefcaseBusiness,
  FileBadge2,
  BellRing,
  ClipboardList,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getAdminDashboardStats } from "@/services/admin";
import type { AdminDashboardData } from "@/services/admin";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { LucideIcon } from "lucide-react";

type MetricCard = {
  key: string;
  title: string;
  value: number | string;
  subtext?: string;
  navigateTo?: string;
  icon: (props: { className?: string }) => JSX.Element;
  accent: string;
};

type DistributionItem = {
  label: string;
  value: number;
  percent: number;
};

type AlertInfo = {
  label: string;
  value: number;
  navigateTo: string;
  icon: LucideIcon;
  accent: string;
};

const formatNumber = (value?: number) =>
  typeof value === "number" ? value.toLocaleString() : "-";

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

interface StatsGridProps {
  cards: MetricCard[];
  isLoading: boolean;
  onNavigate: (path: string) => void;
}

const StatsGrid = memo(({ cards, isLoading, onNavigate }: StatsGridProps) => (
  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {cards.map((card) => {
      const Icon = card.icon;
      const isInteractive = Boolean(card.navigateTo);
      const disabled = isLoading || !isInteractive;

      return (
        <button
          key={card.key}
          type="button"
          onClick={() => card.navigateTo && onNavigate(card.navigateTo)}
          disabled={disabled}
          className={cn(
            "rounded-2xl border border-border bg-card/80 p-4 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isInteractive &&
              "hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md",
            disabled && "cursor-default opacity-75"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {card.title}
            </span>
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-sm",
                card.accent
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-semibold text-foreground">
            {isLoading ? <Skeleton className="h-8 w-20" /> : card.value}
          </div>
          {card.subtext ? (
            <p className="mt-1 text-xs text-muted-foreground">{card.subtext}</p>
          ) : null}
        </button>
      );
    })}
  </section>
));

StatsGrid.displayName = "StatsGrid";

interface OverviewPanelProps {
  isLoading: boolean;
  roleDistribution: DistributionItem[];
  statusDistribution: DistributionItem[];
  applicationStatus: DistributionItem[];
  jobsActive?: number;
  jobsGrowth?: number;
  applicationsTotal?: number;
  applicationsGrowth?: number;
  applicationsThisMonth?: number;
}

const OverviewPanel = memo(
  ({
    isLoading,
    roleDistribution,
    statusDistribution,
    applicationStatus,
    jobsActive,
    jobsGrowth,
    applicationsTotal,
    applicationsGrowth,
    applicationsThisMonth,
  }: OverviewPanelProps) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Platform overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>User mix</span>
                <span>By role</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {roleDistribution.map((role) => (
                  <div
                    key={role.label}
                    className="rounded-xl border border-border/80 bg-muted/30 p-3"
                  >
                    <p className="text-xs uppercase text-muted-foreground">
                      {role.label}
                    </p>
                    <p className="text-xl font-semibold text-foreground">
                      {formatNumber(role.value)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {role.percent}% of total users
                    </p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-3">
                {statusDistribution.map((status) => (
                  <div key={status.label}>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{status.label}</span>
                      <span>
                        {formatNumber(status.value)} · {status.percent}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${status.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-teal-50/60 p-4">
                  <div className="flex items-center gap-2 text-teal-700">
                    <BriefcaseBusiness className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">
                      Active jobs
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-teal-900">
                    {formatNumber(jobsActive)}
                  </p>
                  <p className="text-xs text-teal-700">
                    {formatNumber(jobsGrowth)} posted this week
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-emerald-50/60 p-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <ClipboardList className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">
                      Applications
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-emerald-900">
                    {formatNumber(applicationsTotal)}
                  </p>
                  <p className="text-xs text-emerald-700">
                    {formatNumber(applicationsGrowth)} this week ·
                    {" "}
                    {formatNumber(applicationsThisMonth)} this month
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {applicationStatus.map((status) => (
                  <div key={status.label}>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{status.label}</span>
                      <span>
                        {formatNumber(status.value)} · {status.percent}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${status.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
);

OverviewPanel.displayName = "OverviewPanel";

interface TrendPanelProps {
  isLoading: boolean;
  registrationTrend: AdminDashboardData["userRegistrationTrend"] | [];
  applicationStatus: DistributionItem[];
}

const TrendPanel = memo(
  ({ isLoading, registrationTrend, applicationStatus }: TrendPanelProps) => (
    <section className="grid gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Registration trend (7 days)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={8} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} tickMargin={8} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0f766e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Application status mix
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickMargin={8} />
                <YAxis
                  allowDecimals={false}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip formatter={(value: number, name) => [`${value}%`, String(name)]} />
                <Legend />
                <Bar dataKey="percent" radius={[6, 6, 0, 0]} fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </section>
  )
);

TrendPanel.displayName = "TrendPanel";

interface ActivityColumnProps {
  isLoading: boolean;
  alerts: AlertInfo[];
  recentActivity: AdminDashboardData["recentActivity"] | [];
  trendingJobs: AdminDashboardData["trending"]["jobs"] | [];
  announcements?: AdminDashboardData["announcements"];
  reports?: AdminDashboardData["reports"];
  onNavigate: (path: string) => void;
}

const ActivityColumn = memo(
  ({
    isLoading,
    alerts,
    recentActivity,
    trendingJobs,
    announcements,
    reports,
    onNavigate,
  }: ActivityColumnProps) => (
    <section className="grid gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Recent platform activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent activity to display.
            </p>
          ) : (
            recentActivity.slice(0, 6).map((item) => (
              <div
                key={`${item.type}-${item.timestamp}-${item.title}`}
                className="flex flex-col gap-1 rounded-xl border border-border/80 bg-card px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {item.title}
                  </span>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    {item.type.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Alerts & follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert) => {
              const Icon = alert.icon ?? BellRing;
              return (
                <div
                  key={alert.label}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                          alert.accent
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {alert.label}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requires attention
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    onClick={() => onNavigate(alert.navigateTo)}
                  >
                    {formatNumber(alert.value)}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            <Separator />
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                Announcements: {formatNumber(announcements?.active)} active ·{" "}
                {formatNumber(announcements?.total)} total
              </p>
              <p>
                Reports: {formatNumber(reports?.unresolved)} pending · {" "}
                {formatNumber(reports?.total)} submitted
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Trending jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : trendingJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No trending roles this week.
              </p>
            ) : (
              trendingJobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/40 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {job.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(job.applicationsThisWeek)} applications this week
                    </p>
                  </div>
                  <Badge variant="outline" className="border-primary text-primary">
                    #{job.applicationsThisWeek || 0}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
);

ActivityColumn.displayName = "ActivityColumn";

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
      { label: "Students", value: student, percent: Math.round((student / total) * 100) },
      { label: "Employers", value: employer, percent: Math.round((employer / total) * 100) },
      { label: "Professors", value: professor, percent: Math.round((professor / total) * 100) },
      { label: "Admins", value: admin, percent: Math.round((admin / total) * 100) },
    ];
  }, [data]);

  const statusDistribution = useMemo<DistributionItem[]>(() => {
    if (!data) return [];
    const { pending, approved, rejected, suspended } = data.users.byStatus;
    const total = pending + approved + rejected + suspended || 1;
    return [
      { label: "Approved", value: approved, percent: Math.round((approved / total) * 100) },
      { label: "Pending", value: pending, percent: Math.round((pending / total) * 100) },
      { label: "Rejected", value: rejected, percent: Math.round((rejected / total) * 100) },
      { label: "Suspended", value: suspended, percent: Math.round((suspended / total) * 100) },
    ];
  }, [data]);

  const applicationStatus = useMemo<DistributionItem[]>(() => {
    if (!data) return [];
    const { pending, qualified, rejected } = data.applications.byStatus;
    const total = pending + qualified + rejected || 1;
    return [
      { label: "Qualified", value: qualified, percent: Math.round((qualified / total) * 100) },
      { label: "Pending", value: pending, percent: Math.round((pending / total) * 100) },
      { label: "Rejected", value: rejected, percent: Math.round((rejected / total) * 100) },
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
