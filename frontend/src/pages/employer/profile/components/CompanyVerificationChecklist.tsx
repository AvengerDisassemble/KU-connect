import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type VerificationStatus = "completed" | "waiting";

export interface VerificationItem {
  id: string;
  title: string;
  description: string;
  status: VerificationStatus;
}

interface StatusDotProps {
  status: VerificationStatus;
}

function StatusDot({ status }: StatusDotProps): ReactElement {
  const color = status === "completed" ? "bg-accent" : "bg-muted-foreground/40";

  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${color}`}
      aria-label={status}
    />
  );
}

interface VerificationChecklistProps {
  items: VerificationItem[];
}

const VerificationChecklist: React.FC<VerificationChecklistProps> = ({
  items,
}) => {
  return (
    <Card className="border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Verification Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <StatusDot status={item.status} />
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default VerificationChecklist;
