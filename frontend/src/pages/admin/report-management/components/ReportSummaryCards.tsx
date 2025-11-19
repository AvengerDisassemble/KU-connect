import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportSummaryCardsProps {
  totalReports: number;
  unresolvedReports: number;
  isLoading: boolean;
}

const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({
  totalReports,
  unresolvedReports,
  isLoading,
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
        <Badge variant="outline">{totalReports}</Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? <Skeleton className="h-8 w-16" /> : totalReports}
        </div>
        <p className="text-xs text-muted-foreground">
          Aggregate reports filed by students or employers.
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Unresolved Reports</CardTitle>
        <AlertTriangle className="h-5 w-5 text-amber-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? <Skeleton className="h-8 w-16" /> : unresolvedReports}
        </div>
        <p className="text-xs text-muted-foreground">
          Reports still awaiting moderator action.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default ReportSummaryCards;
