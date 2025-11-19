import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimestamp } from "../utils";

interface WelcomeHeaderProps {
  firstName: string;
  timestamp?: string;
}

const WelcomeHeader = ({ firstName, timestamp }: WelcomeHeaderProps) => {
  return (
    <Card className="border-border/80 bg-card/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <CardContent className="space-y-4 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Student dashboard
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Welcome, {firstName}
          </h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" aria-hidden />
            Last updated {formatTimestamp(timestamp)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeHeader;
