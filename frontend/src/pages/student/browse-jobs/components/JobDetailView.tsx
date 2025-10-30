import {
  MapPin,
  DollarSign,
  Calendar,
  Building2,
  Briefcase,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Job } from "@/services/jobs";
import { formatSalary, formatDeadline, getJobTypeColor } from "../utils";

interface JobDetailViewProps {
  job: Job | null;
  onApply?: (jobId: string) => void;
  isApplied?: boolean;
  isApplying?: boolean;
}

const JobDetailView = ({
  job,
  onApply,
  isApplied = false,
  isApplying = false,
}: JobDetailViewProps) => {
  if (!job) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Select a job to view details
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose a job from the list to see more information
          </p>
        </div>
      </div>
    );
  }

  const formatPostedDate = (date?: string | null) => {
    if (!date) return "Posted recently";

    const posted = new Date(date);
    if (Number.isNaN(posted.getTime())) return "Posted recently";

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Posted today";
    if (diffDays < 7) return `Posted ${diffDays} days ago`;
    if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
    return `Posted ${Math.floor(diffDays / 30)} months ago`;
  };

  const getWorkArrangementColor = (arrangement?: string | null) => {
    switch (arrangement?.toLowerCase()) {
      case "remote":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300";
      case "onsite":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300";
      case "hybrid":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {job.title || "Untitled role"}
              </h1>
              <p className="text-lg text-muted-foreground">
                {job.companyName || "Company name unavailable"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className={getJobTypeColor(job.jobType)}>
              {job.jobType ?? "Job type"}
            </Badge>
            <Badge
              variant="outline"
              className={getWorkArrangementColor(job.workArrangement)}
            >
              {job.workArrangement ?? "Work arrangement"}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Clock className="h-4 w-4" />
            <span>{formatPostedDate(job.createdAt)}</span>
          </div>

          <div className="flex gap-3">
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-none"
              disabled={!onApply || isApplied || isApplying}
              onClick={() => {
                if (!job || !onApply || isApplied || isApplying) return;
                onApply(job.id);
              }}
            >
              {isApplying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying…
                </span>
              ) : isApplied ? (
                "Applied"
              ) : (
                "Apply Now"
              )}
            </Button>
            <Button
              variant="outline"
              className="border-border hover:bg-secondary"
            >
              Save Job
            </Button>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Key Information */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Location</p>
              <p className="text-muted-foreground">
                {job.location || "Location not specified"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Salary Range</p>
              <p className="text-primary font-semibold">
                {formatSalary(job.minSalary, job.maxSalary)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                Application Deadline
              </p>
              <p className="text-muted-foreground">
                {formatDeadline(job.application_deadline)}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Job Description */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Job Description
          </h2>
          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
            <p>{job.description || "No description provided."}</p>
          </div>
        </div>

        {/* Additional sections can be added here */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
          <h3 className="font-medium text-foreground mb-2">About this role</h3>
          <p className="text-sm text-muted-foreground">
            This position is posted by {job.companyName || "the employer"}.
            Apply before {formatDeadline(job.application_deadline)} to be
            considered for this opportunity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobDetailView;
