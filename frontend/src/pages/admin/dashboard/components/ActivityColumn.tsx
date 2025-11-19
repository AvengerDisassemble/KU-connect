import { memo } from "react";
import { ArrowRight, BellRing } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { AdminDashboardData } from "@/services/admin";
import { cn } from "@/lib/utils";

import type { AlertInfo } from "./types";
import { formatNumber } from "../utils";

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
                Reports: {formatNumber(reports?.unresolved)} pending ·{" "}
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

export default ActivityColumn;
