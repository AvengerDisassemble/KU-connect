import { useMemo } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProfessorDashboardSummary } from "@/services/professor";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
);

const resolveThemeColor = (tokens: string[], fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  const styles = getComputedStyle(document.documentElement);
  for (const token of tokens) {
    const value = styles.getPropertyValue(token)?.trim();
    if (!value || value.includes("oklch")) continue;
    if (value.startsWith("#") || value.startsWith("rgb") || value.startsWith("hsl")) {
      return value;
    }
  }
  return fallback;
};

const withAlpha = (color: string, alpha: number, fallback = "rgba(178,187,30,0.25)") => {
  if (color.startsWith("#")) {
    const hex = color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (color.startsWith("rgb")) {
    return color.replace("rgb", "rgba").replace(")", `, ${alpha})`);
  }
  return fallback;
};

interface TrendChartCardProps {
  data: ProfessorDashboardSummary["applicationTrends"]["daily"];
  isLoading: boolean;
}

const TrendChartCard: React.FC<TrendChartCardProps> = ({ data, isLoading }) => {
  const { accentColor, accentFill } = useMemo(() => {
    const color = resolveThemeColor(
      ["--accent", "--color-accent", "--brand-lime"],
      "#b2bb1e",
    );
    return { accentColor: color, accentFill: withAlpha(color, 0.25) };
  }, []);
  const chartData = useMemo(
    () => ({
      labels: data.map((point) =>
        new Date(point.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      ),
      datasets: [
        {
          label: "Applications",
          data: data.map((point) => point.applications),
          fill: true,
          tension: 0.4,
          backgroundColor: accentFill,
          borderColor: accentColor,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: accentColor,
          borderWidth: 3,
        },
      ],
    }),
    [accentColor, accentFill, data],
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "rgba(0,0,0,0.6)" },
          title: {
            display: true,
            text: "Date",
            color: "rgba(0,0,0,0.6)",
            font: { size: 12, weight: 600 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.05)" },
          ticks: {
            color: "rgba(0,0,0,0.6)",
            callback: (value: string | number) => `${value}`,
          },
          title: {
            display: true,
            text: "Applications per day",
            color: "rgba(0,0,0,0.6)",
            font: { size: 12, weight: 600 },
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1d1b64",
          padding: 12,
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          callbacks: {
            title: (items: { label: string }[]) =>
              items[0]?.label ? `Date: ${items[0].label}` : "",
            label: (ctx: { formattedValue: string }) =>
              `Applications: ${ctx.formattedValue}`,
          },
        },
      },
    }),
    [],
  );

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Application Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : data.length ? (
          <div className="relative h-[280px] w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No trend data available yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChartCard;
