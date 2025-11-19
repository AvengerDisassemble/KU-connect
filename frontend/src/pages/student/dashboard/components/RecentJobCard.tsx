import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  MapPin,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JobItem } from "@/services/dashboard";
import type { WorkArrangement } from "../utils";
import {
  describeTimeUntilDeadline,
  detectWorkArrangement,
  formatDate,
  isUpcomingDeadline,
} from "../utils";

interface RecentJobCardProps {
  jobs: JobItem[];
}

const BROWSE_JOBS_PATH = "/student/browse-jobs";

const ARRANGEMENT_STYLES: Record<WorkArrangement, string> = {
  "On-site": "bg-emerald-100 text-emerald-900 border-transparent",
  Hybrid: "bg-blue-100 text-blue-900 border-transparent",
  Remote: "bg-amber-100 text-amber-900 border-transparent",
  Flexible: "bg-purple-100 text-purple-900 border-transparent",
};

const RecentJobCard = ({ jobs }: RecentJobCardProps) => {
  const visibleJobs = useMemo(() => jobs.slice(0, 4), [jobs]);

  return (
    <Card className="h-full border-border/80 bg-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold text-foreground">
          Recent job matches
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Roles surfaced from your interests
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleJobs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/40 p-6 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/70" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                No recent jobs yet
              </p>
              <p className="text-sm text-muted-foreground">
                Check back soon — new jobs will appear here automatically.
              </p>
            </div>
            <Button asChild>
              <Link to={BROWSE_JOBS_PATH}>Browse jobs</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {visibleJobs.map((job) => {
              const arrangement = detectWorkArrangement(job.location);
              const upcoming = isUpcomingDeadline(job.applicationDeadline);
              const deadlineText = formatDate(
                job.applicationDeadline,
                "Not provided"
              );
              const relative = describeTimeUntilDeadline(
                job.applicationDeadline
              );

              return (
                <li
                  key={job.id}
                  className="rounded-2xl border border-border/70 bg-background/60 p-4 transition hover:border-primary/40"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={ARRANGEMENT_STYLES[arrangement]}
                      >
                        {arrangement}
                      </Badge>
                      {upcoming ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-900"
                        >
                          <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                          Upcoming deadline
                        </Badge>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-foreground">
                        {job.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {job.hr?.companyName ?? "Unknown company"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" aria-hidden />
                        {job.location ?? "Location not specified"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-4 w-4" aria-hidden />
                        Apply by {deadlineText}
                      </span>
                      {relative ? <span>{relative}</span> : null}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between text-primary sm:w-auto"
                      asChild
                    >
                      <Link to={`${BROWSE_JOBS_PATH}?job=${job.id}`}>
                        View job
                        <span aria-hidden>→</span>
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentJobCard;
