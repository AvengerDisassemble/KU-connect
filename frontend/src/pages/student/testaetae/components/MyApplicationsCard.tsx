import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  ClipboardList,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ApplicationItem } from "@/services/dashboard";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { formatDeadline } from "@/pages/student/browse-jobs/utils";

interface MyApplicationsCardProps {
  applications: ApplicationItem[];
}

const BROWSE_JOBS_PATH = "/student/browse-jobs";
const APPLICATIONS_SECTION_PATH = "/student#applications";

const STATUS_STYLES: Record<ApplicationItem["status"], string> = {
  PENDING:
    "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100",
  QUALIFIED:
    "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100",
  REJECTED:
    "bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-100",
};

const formatStatusLabel = (status: ApplicationItem["status"]) => {
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export const MyApplicationsCard = ({
  applications,
}: MyApplicationsCardProps) => {
  const safeApplications = useMemo(
    () => applications.slice(0, 5),
    [applications]
  );

  return (
    <Card className="flex h-full flex-col border-border bg-card/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              My applications
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Track the progress of your recent submissions
            </p>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary">
            {applications.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {safeApplications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/40 p-6 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground/60" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">No applications yet</p>
              <p className="text-sm text-muted-foreground">
                Once you apply to a job, you can monitor its status here.
              </p>
            </div>
            <Button asChild variant="secondary" className="mt-2">
              <Link to={BROWSE_JOBS_PATH}>Start applying</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {safeApplications.map((application) => {
              const companyName =
                application.job.hr?.companyName ?? "Unknown company";
              const avatarSeed = encodeURIComponent(companyName);

              return (
                <li
                  key={application.id}
                  className="rounded-xl border border-border/80 bg-background/60 p-4 transition hover:border-primary/40"
                >
                  <div className="flex gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}`}
                        alt={companyName}
                      />
                      <AvatarFallback>
                        {companyName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-foreground">
                            {application.job.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {companyName}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`border-transparent ${
                            STATUS_STYLES[application.status]
                          }`}
                        >
                          {formatStatusLabel(application.status)}
                        </Badge>
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" aria-hidden />
                          Applied {formatRelativeTime(application.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-4 w-4" aria-hidden />
                          Deadline{" "}
                          {formatDeadline(application.job.applicationDeadline)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 h-8 gap-1 text-primary"
                    asChild
                  >
                    <Link to={`${BROWSE_JOBS_PATH}?job=${application.job.id}`}>
                      View application
                      <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      {safeApplications.length > 0 ? (
        <CardFooter className="border-t border-border/80 bg-muted/30">
          <Button variant="ghost" asChild className="gap-2 text-primary">
            <Link to={APPLICATIONS_SECTION_PATH}>
              View all applications
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
};

export default MyApplicationsCard;
