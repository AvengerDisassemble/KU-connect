import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { RefreshCcw, ArrowRight } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getAdminDashboardStats } from "@/services/admin";
import type { AdminDashboardData } from "@/services/admin";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type MetricCard = {
  key: string;
  title: string;
  description: string;
  value: number | string;
  highlight?: string;
  cta?: string;
  navigateTo?: string;
};

const ROLE_COLORS = ["#0f766e", "#84cc16", "#14b8a6", "#facc15"];
const STATUS_COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#ef4444"];

const formatNumber = (value?: number) =>
  typeof value === "number" ? value.toLocaleString() : "-";

const buildMetricCards = (data?: AdminDashboardData): MetricCard[] => {
  if (!data) {
    return [
      {
        key: "users",
        title: "Total Users",
        description: "Platform-wide registered users",
        value: "-",
      },
    ];
  }

  return [
    {
      key: "users",
      title: "Total Users",
      description: "Platform-wide registered users",
      value: formatNumber(data.users.total),
      highlight: `${formatNumber(data.users.growth.thisWeek)} new this week`,
      cta: "Manage users",
      navigateTo: "/admin/users",
    },
    {
      key: "jobs",
      title: "Active Jobs",
      description: "Listings available to students",
      value: formatNumber(data.jobs.active),
      highlight: `${formatNumber(data.jobs.growth.thisWeek)} posted this week`,
      cta: "Browse job reports",
      navigateTo: "/admin/reports",
    },
    {
      key: "approvals",
      title: "Pending Approvals",
      description: "Users awaiting verification",
      value: formatNumber(data.alerts.pendingApprovals),
      cta: "Review pending users",
      navigateTo: "/admin/users?tab=pending",
    },
    {
      key: "reports",
      title: "Unresolved Reports",
      description: "Job reports requiring action",
      value: formatNumber(data.alerts.unresolvedReports),
      cta: "Moderate reports",
      navigateTo: "/admin/reports",
    },
    {
      key: "announcements",
      title: "Total Announcements",
      description: "Active notices across the platform",
      value: formatNumber(data.announcements.total),
      highlight: `${formatNumber(data.announcements.active)} currently active`,
      cta: "Manage announcements",
      navigateTo: "/admin/announcements",
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

  const roleDistribution = useMemo(
    () =>
      data
        ? [
            { name: "Students", value: data.users.byRole.student },
            { name: "Employers", value: data.users.byRole.employer },
            { name: "Professors", value: data.users.byRole.professor },
            { name: "Admins", value: data.users.byRole.admin },
          ]
        : [],
    [data]
  );

  const statusDistribution = useMemo(
    () =>
      data
        ? [
            { name: "Pending", value: data.users.byStatus.pending },
            { name: "Approved", value: data.users.byStatus.approved },
            { name: "Rejected", value: data.users.byStatus.rejected },
            { name: "Suspended", value: data.users.byStatus.suspended },
          ]
        : [],
    [data]
  );

  const registrationTrend = useMemo(
    () => data?.userRegistrationTrend ?? [],
    [data]
  );

  const alerts = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: "Pending approvals",
        value: data.alerts.pendingApprovals,
        navigateTo: "/admin/users?tab=pending",
      },
      {
        label: "Unresolved reports",
        value: data.alerts.unresolvedReports,
        navigateTo: "/admin/reports",
      },
      {
        label: "Inactive jobs",
        value: data.alerts.inactiveJobs,
        navigateTo: "/admin/reports",
      },
    ];
  }, [data]);

  const recentActivity = data?.recentActivity ?? [];

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
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((card) => (
          <Card
            key={card.key}
            role="button"
            tabIndex={0}
            onClick={() => card.navigateTo && navigate(card.navigateTo)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && card.navigateTo) {
                navigate(card.navigateTo);
              }
            }}
            className={`group cursor-pointer border border-border transition hover:border-teal-500 hover:shadow-lg ${
              isLoading ? "pointer-events-none" : ""
            }`}
          >
            <CardHeader className="space-y-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                {card.title}
              </CardTitle>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {card.value}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {card.description}
              </p>
              {card.highlight ? (
                <Badge
                  variant="outline"
                  className="border-teal-500 text-teal-600"
                >
                  {card.highlight}
                </Badge>
              ) : null}
              {card.cta ? (
                <div className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 transition group-hover:text-teal-700">
                  <span>{card.cta}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              User Registration Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
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

        <div className="grid gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Role Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="flex h-72 flex-col items-center justify-center">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={ROLE_COLORS[index % ROLE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis
                      allowDecimals={false}
                      stroke="#64748b"
                      fontSize={12}
                    />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {statusDistribution.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <>
                {[...Array(5)].map((_, idx) => (
                  <Skeleton key={idx} className="h-14 w-full" />
                ))}
              </>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent activity to display.
              </p>
            ) : (
              recentActivity.map((item) => (
                <div
                  key={`${item.type}-${item.timestamp}`}
                  className="rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {item.title}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-teal-500/10 text-teal-700"
                    >
                      {item.type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.label}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {alert.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requires attention
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate(alert.navigateTo)}
                >
                  {formatNumber(alert.value)}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Separator />
            <p className="text-xs text-muted-foreground">
              Dashboard auto-refreshes every 30 seconds to keep metrics fresh.
            </p>
          </CardContent>
        </Card>
      </section>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
