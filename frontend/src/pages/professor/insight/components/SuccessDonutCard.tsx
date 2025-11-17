import { useMemo } from "react";
import {
  Chart,
  ArcElement,
  Tooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProfessorDashboardSummary } from "@/services/professor";

Chart.register(ArcElement, Tooltip);

interface SuccessDonutCardProps {
  byStatus: ProfessorDashboardSummary["applicationMetrics"]["byStatus"] | undefined;
  qualifiedRate: number;
  isLoading: boolean;
}

const SuccessDonutCard: React.FC<SuccessDonutCardProps> = ({
  byStatus,
  qualifiedRate,
  isLoading,
}) => {
  const { primaryColor, dangerColor } = useMemo(() => {
    if (typeof window === "undefined") {
      return { primaryColor: "#006664", dangerColor: "#ef4444" };
    }
    const styles = getComputedStyle(document.documentElement);
    const resolveColor = (token: string, fallback: string) => {
      const value = styles.getPropertyValue(token).trim();
      if (!value || value.includes("oklch")) return fallback;
      if (value.startsWith("#") || value.startsWith("rgb") || value.startsWith("hsl")) {
        return value;
      }
      return fallback;
    };
    const brandPrimary = resolveColor("--brand-teal", "#006664");
    const fallbackDanger = resolveColor("--brand-danger", "#ef4444");
    return {
      primaryColor: resolveColor("--primary", brandPrimary),
      dangerColor: resolveColor("--destructive", fallbackDanger),
    };
  }, []);

  const segments = useMemo(() => {
    if (byStatus) {
      return [
        { label: "Qualified", value: byStatus.qualified || 0.01, color: primaryColor },
        { label: "Rejected", value: byStatus.rejected || 0.01, color: dangerColor },
      ];
    }
    const normalized = Math.min(1, Math.max(0.01, qualifiedRate));
    return [
      { label: "Qualified", value: normalized, color: primaryColor },
      { label: "Rejected", value: 1 - normalized, color: dangerColor },
    ];
  }, [byStatus, dangerColor, primaryColor, qualifiedRate]);

  const donutChartData = useMemo(
    () => ({
      labels: segments.map((segment) => segment.label),
      datasets: [
        {
          data: [1],
          backgroundColor: ["#eef2ff"],
          borderWidth: 0,
          cutout: "68%",
          circumference: 360,
          weight: 0.5,
        },
        {
          data: segments.map((segment) => segment.value || 0.01),
          backgroundColor: segments.map((segment) => segment.color),
          borderWidth: 0,
          cutout: "68%",
          borderRadius: 50,
          spacing: 4,
          weight: 2,
        },
      ],
    }),
    [segments],
  );

  const donutOptions = useMemo(
    () => ({
      cutout: "68%",
      rotation: -90,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1d1b64",
          padding: 10,
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
        },
      },
    }),
    [],
  );

  const total = useMemo(() => {
    if (byStatus) {
      const sum = (byStatus.qualified ?? 0) + (byStatus.rejected ?? 0);
      if (sum > 0) return Math.round(((byStatus.qualified ?? 0) / sum) * 100);
    }
    return Math.round(qualifiedRate * 100);
  }, [byStatus, qualifiedRate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {isLoading ? (
          <Skeleton className="h-[220px] w-[220px] rounded-full" />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-40 w-40">
              <Doughnut data={donutChartData} options={donutOptions} />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-primary">{total}%</span>
                <span className="text-xs text-muted-foreground">Success</span>
              </div>
            </div>
            <div className="w-full space-y-2">
              {segments.map((segment) => (
                <div key={segment.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                  {segment.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuccessDonutCard;
