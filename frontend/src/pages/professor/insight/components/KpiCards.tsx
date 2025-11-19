import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiCardsProps {
  activeJobPostings?: number;
  newJobsThisMonth?: number;
  percentChange?: number;
  trend?: "increasing" | "decreasing" | "stable";
  isLoading?: boolean;
}

const KpiCards: React.FC<KpiCardsProps> = ({
  activeJobPostings,
  newJobsThisMonth,
  percentChange,
  trend,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const change = percentChange ?? 0;
  const TrendIcon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;
  const trendColor =
    change > 0 ? "text-emerald-600" : change < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Active Job Postings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-foreground">{activeJobPostings ?? "--"}</p>
          <p className="text-sm text-muted-foreground">Total live opportunities</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>New Jobs This Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`${trendColor} flex h-12 w-12 items-center justify-center rounded-full bg-muted`}>
              <TrendIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{newJobsThisMonth ?? "--"}</p>
              <p className="text-sm text-muted-foreground">
                {trend === "increasing"
                  ? "Hiring activity is rising"
                  : trend === "decreasing"
                    ? "Slight cooldown vs last month"
                    : "Hiring pace is steady"}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-xs uppercase text-muted-foreground tracking-wide">MoM change</p>
            <p className="text-lg font-semibold text-foreground">
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KpiCards;
