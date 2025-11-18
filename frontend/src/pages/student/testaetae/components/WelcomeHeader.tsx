import { Clock } from "lucide-react";

interface WelcomeHeaderProps {
  firstName: string;
  timestamp?: string;
}

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) {
    return "Just now";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const WelcomeHeader = ({ firstName, timestamp }: WelcomeHeaderProps) => {
  return (
    <header className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Student Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
          Welcome back, {firstName}!
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" aria-hidden />
          <span>Last updated {formatTimestamp(timestamp)}</span>
        </div>
      </div>
    </header>
  );
};

export default WelcomeHeader;
