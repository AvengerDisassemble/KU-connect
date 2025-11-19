import { memo } from "react";
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

export default TrendPanel;
