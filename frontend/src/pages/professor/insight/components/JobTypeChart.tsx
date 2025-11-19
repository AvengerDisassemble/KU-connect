import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
      <CardContent className="flex h-80 flex-col gap-4">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : normalized && normalized.length ? (
          <>
            <div className="flex justify-end gap-4 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                Applications
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Open Roles
              </div>
            </div>
            <div className="flex-1">
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
                    label={{
                      value: "Count",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                      style: { fill: "currentColor", fontSize: 12 },
                    }}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "currentColor", fontSize: 12 }}
                  />
                  <Tooltip
                    wrapperClassName="rounded-xl border border-border bg-background/95 backdrop-blur"
                    contentStyle={{ borderRadius: "0.75rem" }}
                  />
                  <Legend wrapperStyle={{ display: "none" }} />
                  <Bar dataKey="applications" name="Applications" className="fill-accent" />
                  <Bar dataKey="roles" name="Open Roles" className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No job type data to display.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default JobTypeChart;
