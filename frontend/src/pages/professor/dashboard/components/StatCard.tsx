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
    <Card className="relative overflow-hidden rounded-2xl border border-transparent bg-bg-2 shadow-[0_12px_32px_rgba(17,24,39,0.08)]">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-accent" />

      {/* mobile-first padding and layout: p-4 base, p-6 on sm; stack content on base and row on sm */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between w-full gap-3 p-4 sm:p-6">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">
            {label}
          </div>

          <div className="mt-1 text-2xl font-bold text-primary truncate sm:text-3xl md:text-4xl">
            {value}
          </div>

          {subtitle ? (
            <p className="mt-1 text-sm text-accent truncate">{subtitle}</p>
          ) : null}

          {/* On mobile, show change pill and caption under the value */}
          {hasChange ? (
            <div className="mt-2 flex flex-col items-start gap-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold",
                  isPositive ? "bg-accent/40 text-primary" : "bg-destructive/10 text-destructive",
                )}
              >
                {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(change!)}%
              </span>
              <div className="text-xs text-primary/80 mt-0">{changeCaption}</div>
            </div>
          ) : null}
        </div>

        {/* On sm+ keep the pill on the right like before */}
      </div>
    </Card>
  );
};

export default ProfessorStatCard;
