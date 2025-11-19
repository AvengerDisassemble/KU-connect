import { memo } from "react";
import { BriefcaseBusiness, ClipboardList } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import type { DistributionItem } from "./types";
import { formatNumber } from "../utils";

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
                    {formatNumber(applicationsGrowth)} this week ·{" "}
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

export default OverviewPanel;
