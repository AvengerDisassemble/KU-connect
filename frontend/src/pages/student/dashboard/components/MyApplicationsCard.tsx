import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { ApplicationItem } from "@/services/dashboard";
import { formatDate } from "../utils";

interface MyApplicationsCardProps {
  applications: ApplicationItem[];
}

const BROWSE_JOBS_PATH = "/student/browse-jobs";

const STATUS_STYLES: Record<ApplicationItem["status"], string> = {
  PENDING: "bg-amber-100 text-amber-900 border-transparent",
  QUALIFIED: "bg-emerald-100 text-emerald-900 border-transparent",
  REJECTED: "bg-rose-100 text-rose-900 border-transparent",
};

const MyApplicationsCard = ({ applications }: MyApplicationsCardProps) => {
  const rows = useMemo(() => applications.slice(0, 5), [applications]);

  if (rows.length === 0) {
    return (
      <Card
        id="applications"
        className="h-full border-border/80 bg-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80"
      >
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-semibold text-foreground">
            My applications
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track submissions as soon as you apply
          </p>
        </CardHeader>
        <CardContent className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/70" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              You have not applied to any jobs yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Once you apply, statuses and deadlines will appear here.
            </p>
          </div>
          <Button asChild>
            <Link to={BROWSE_JOBS_PATH}>Browse jobs</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      id="applications"
      className="h-full border-border/80 bg-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80"
    >
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold text-foreground">
          My applications
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Monitor your latest submissions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    {application.job.title}
                  </TableCell>
                  <TableCell>
                    {application.job.hr?.companyName ?? "Unknown company"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={STATUS_STYLES[application.status]}
                    >
                      {application.status
                        .toLowerCase()
                        .replace(/^\w/, (char) => char.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDate(application.createdAt, "—")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-between text-primary"
          asChild
        >
          <Link to="/student#applications">
            View applications
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default MyApplicationsCard;
