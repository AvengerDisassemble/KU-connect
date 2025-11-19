import { memo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { MetricCard } from "./types";

interface StatsGridProps {
  cards: MetricCard[];
  isLoading: boolean;
  onNavigate: (path: string) => void;
}

const StatsGrid = memo(({ cards, isLoading, onNavigate }: StatsGridProps) => (
  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {cards.map((card) => {
      const Icon = card.icon;
      const isInteractive = Boolean(card.navigateTo);
      const disabled = isLoading || !isInteractive;

      return (
        <button
          key={card.key}
          type="button"
          onClick={() => card.navigateTo && onNavigate(card.navigateTo)}
          disabled={disabled}
          className={cn(
            "rounded-2xl border border-border bg-card/80 p-4 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isInteractive &&
              "hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md",
            disabled && "cursor-default opacity-75"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {card.title}
            </span>
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-sm",
                card.accent
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-semibold text-foreground">
            {isLoading ? <Skeleton className="h-8 w-20" /> : card.value}
          </div>
          {card.subtext ? (
            <p className="mt-1 text-xs text-muted-foreground">{card.subtext}</p>
          ) : null}
        </button>
      );
    })}
  </section>
));

StatsGrid.displayName = "StatsGrid";

export default StatsGrid;
