import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { JobTypeInsight } from "@/types/professorDashboardAnalytics";

interface JobTypeChartProps {
  jobTypes?: JobTypeInsight[];
  isLoading?: boolean;
}

const JobTypeChart: React.FC<JobTypeChartProps> = ({ jobTypes, isLoading }) => {
  const normalized = jobTypes?.map((job) => ({
    label: job.type,
    applications: job.applications,
    roles: job.count,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Job Type Mix</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : normalized && normalized.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={normalized} barSize={32}>
              <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
              <XAxis
                dataKey="label"
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
              <Bar dataKey="applications" name="Applications" className="fill-primary" />
              <Bar dataKey="roles" name="Open Roles" className="fill-secondary" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No job type data to display.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default JobTypeChart;
