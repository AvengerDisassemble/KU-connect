import { useMemo } from "react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendsChartPoint {
  date: string;
  applications: number;
  newJobs: number;
}

interface TrendsChartProps {
  data?: TrendsChartPoint[];
  title?: string;
  isLoading?: boolean;
}

type DotRendererProps = { cx?: number; cy?: number };

const createRingDot = (color: string, radius: number) => ({ cx, cy }: DotRendererProps) => {
  // Recharts expects a ReactElement (SVG). Return an empty <g /> instead of null to satisfy typings.
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

const TrendsChart: React.FC<TrendsChartProps> = ({
  data,
  title = "Application Trends",
  isLoading,
}) => {
  const applicationsDot = useMemo(() => createRingDot("hsl(var(--primary))", 4), []);
  const applicationsActiveDot = useMemo(
    () => createRingDot("hsl(var(--primary))", 5),
    [],
  );
  const newJobsDot = useMemo(() => createRingDot("hsl(var(--accent))", 4), []);
  const newJobsActiveDot = useMemo(() => createRingDot("hsl(var(--accent))", 5), []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : data && data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "currentColor", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "currentColor", fontSize: 12 }}
              />
              <Tooltip
                wrapperClassName="rounded-xl border border-border bg-background/95 backdrop-blur"
                contentStyle={{ borderRadius: "0.75rem" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="applications"
                name="Applications"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={applicationsDot}
                activeDot={applicationsActiveDot}
              />
              <Line
                type="monotone"
                dataKey="newJobs"
                name="New Jobs"
                stroke="hsl(var(--accent))"
                strokeWidth={3}
                strokeDasharray="6 4"
                dot={newJobsDot}
                activeDot={newJobsActiveDot}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No trend data available.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendsChart;
