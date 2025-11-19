import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const DashboardErrorState = ({
  message,
  onRetry,
}: DashboardErrorStateProps) => {
  return (
    <section className="flex flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-destructive">
          Unable to load dashboard
        </h2>
        <p className="text-sm text-destructive/80">{message}</p>
      </div>
      {onRetry ? (
        <Button
          variant="outline"
          className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={onRetry}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Try again
        </Button>
      ) : null}
    </section>
  );
};

export default DashboardErrorState;
