import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProfessorStatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  change?: number;
  changeCaption?: string;
}

const ProfessorStatCard = ({
  label,
  value,
  subtitle,
  change,
  changeCaption = "vs last month",
}: ProfessorStatCardProps) => {
  const hasChange = typeof change === "number" && !Number.isNaN(change);
  const isPositive = (change ?? 0) >= 0;

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-transparent bg-bg-2 py-4 shadow-[0_12px_32px_rgba(17,24,39,0.08)]">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-accent"
      />
      <div className="space-y-3 p-6 pl-8">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="text-4xl font-bold text-primary">{value}</div>
        {subtitle ? (
          <p className="text-sm text-accent">{subtitle}</p>
        ) : null}
        {hasChange ? (
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                isPositive
                  ? "bg-accent/40 text-primary"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {Math.abs(change!)}%
            </span>
            <span className="text-primary font-semibold">{changeCaption}</span>
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default ProfessorStatCard;
