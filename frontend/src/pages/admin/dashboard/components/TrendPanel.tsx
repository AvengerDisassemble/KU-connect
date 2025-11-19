import { memo, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminDashboardData } from "@/services/admin";

import type { DistributionItem } from "./types";

interface TrendPanelProps {
  isLoading: boolean;
  registrationTrend: AdminDashboardData["userRegistrationTrend"] | [];
  applicationStatus: DistributionItem[];
}

type DotRendererProps = { cx?: number; cy?: number };

const createRingDot = (color: string, radius: number) => ({ cx, cy }: DotRendererProps) => {
  if (typeof cx !== "number" || typeof cy !== "number") {
    return <g />;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill="hsl(var(--background))"
      stroke={color}
      strokeWidth={3}
    />
  );
};

const STATUS_COLORS: Record<string, string> = {
  Qualified: "#10b981",
  Pending: "#fbbf24",
  Rejected: "#f87171",
};

const TrendPanel = memo(
  ({ isLoading, registrationTrend, applicationStatus }: TrendPanelProps) => {
    const formattedRegistrationTrend = useMemo(
      () =>
        (registrationTrend ?? []).map((point) => ({
          date: point.date,
          count: point.count,
        })),
      [registrationTrend]
    );
    const hasRegistrationData = formattedRegistrationTrend.length > 0;
    const registrationDot = useMemo(
      () => createRingDot("hsl(var(--primary))", 4),
      []
    );
    const registrationActiveDot = useMemo(
      () => createRingDot("hsl(var(--primary))", 5),
      []
    );

    const statusData = applicationStatus ?? [];
    const hasStatusData = statusData.length > 0;

    return (
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Registration trend (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-80 flex-col gap-4">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : hasRegistrationData ? (
              <>
                <div className="flex justify-end text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    Registrations
                  </div>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedRegistrationTrend}>
                      <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "currentColor", fontSize: 12 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "currentColor", fontSize: 12 }}
                      />
                      <Tooltip
                        wrapperClassName="rounded-xl border border-border bg-background/95 backdrop-blur"
                        contentStyle={{ borderRadius: "0.75rem" }}
                        formatter={(value: number) => [value, "Registrations"]}
                      />
                      <Legend wrapperStyle={{ display: "none" }} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={registrationDot}
                        activeDot={registrationActiveDot}
                        name="Registrations"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No registration trend data available.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Application status mix
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-80 flex-col gap-4">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : hasStatusData ? (
              <>
                <div className="flex flex-wrap justify-end gap-4 text-xs font-medium text-muted-foreground">
                  {statusData.map((status) => (
                    <div key={status.label} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[status.label] ?? "#0ea5e9" }}
                      />
                      {status.label}
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "currentColor", fontSize: 12 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickFormatter={(val) => `${val}%`}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "currentColor", fontSize: 12 }}
                      />
                      <Tooltip
                        wrapperClassName="rounded-xl border border-border bg-background/95 backdrop-blur"
                        contentStyle={{ borderRadius: "0.75rem" }}
                        formatter={(value: number) => [`${value}%`, "Share"]}
                      />
                      <Legend wrapperStyle={{ display: "none" }} />
                      <Bar dataKey="percent" radius={[8, 8, 0, 0]}>
                        {statusData.map((entry) => (
                          <Cell
                            key={`cell-${entry.label}`}
                            fill={STATUS_COLORS[entry.label] ?? "#0ea5e9"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No application status data available.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    );
  }
);

TrendPanel.displayName = "TrendPanel";

export default TrendPanel;
