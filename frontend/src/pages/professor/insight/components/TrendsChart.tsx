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

const TrendsChart: React.FC<TrendsChartProps> = ({ data, title = "Application Trends", isLoading }) => (
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
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="newJobs"
              name="New Jobs"
              stroke="hsl(var(--secondary))"
              strokeWidth={3}
              strokeDasharray="6 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-muted-foreground">No trend data available.</p>
      )}
    </CardContent>
  </Card>
);

export default TrendsChart;
