import { BriefcaseBusiness, ClipboardList, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsSummaryProps {
  availableJobs: number;
  applicationsSent: number;
  quickActions: number;
}

const FORMATTER = new Intl.NumberFormat();

const formatNumber = (value: number) => {
  return Number.isFinite(value) ? FORMATTER.format(Math.max(0, value)) : "0";
};

export const StatsSummary = ({
  availableJobs,
  applicationsSent,
  quickActions,
}: StatsSummaryProps) => {
  const stats = [
    {
      id: "available-jobs",
      label: "Available jobs",
      value: formatNumber(availableJobs),
      description: "Open opportunities you can explore",
      icon: BriefcaseBusiness,
    },
    {
      id: "applications-sent",
      label: "Applications sent",
      value: formatNumber(applicationsSent),
      description: "Submissions waiting for responses",
      icon: ClipboardList,
    },
    {
      id: "quick-actions",
      label: "Quick actions",
      value: formatNumber(quickActions),
      description: "Things you can do right now",
      icon: Zap,
    },
  ];

  return (
    <section
      aria-label="Dashboard stats"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.id}
            className="border-border bg-card/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">
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
