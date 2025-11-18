import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const DashboardErrorState = ({
  message,
  onRetry,
}: DashboardErrorStateProps) => {
  return (
    <section className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-destructive">
          Unable to load dashboard
        </h2>
        <p className="text-sm text-destructive/80">{message}</p>
      </div>
      {onRetry ? (
        <Button
          onClick={onRetry}
          variant="outline"
          className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Try again
        </Button>
      ) : null}
    </section>
  );
};

export default DashboardErrorState;
