import {
  BriefcaseBusiness,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsSummaryProps {
  recentJobs: number;
  applications: number;
  quickActions: number;
}

const formatter = new Intl.NumberFormat();

const StatsSummary = ({
  recentJobs,
  applications,
}: StatsSummaryProps) => {
  const stats = [
    {
      id: "recent-jobs",
      label: "Recent jobs",
      value: formatter.format(Math.max(0, recentJobs)),
      description: "New roles pulled from your preferences",
      icon: BriefcaseBusiness,
    },
    {
      id: "applications",
      label: "Applications submitted",
      value: formatter.format(Math.max(0, applications)),
      description: "Track where you have applied",
      icon: ClipboardList,
    },
  ];

  return (
    <section
      aria-label="Dashboard stats"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.id}
            className="border-border/80 bg-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
};

export default StatsSummary;
