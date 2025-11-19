import { AlertTriangle, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { JobReportItem } from "@/services/admin";
import type { JobDetail } from "@/services/jobs";
import { formatSalary, formatDeadline } from "@/pages/student/browse-jobs/utils/helpers";

const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString();

interface DetailListItem {
  id: string;
  text: string;
}

interface ReportDetailsDialogProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  report: JobReportItem | null;
  jobDetail?: JobDetail;
  isJobLoading: boolean;
  isJobError: boolean;
  jobError?: Error;
  onResolve: () => void;
  onDeleteJob: () => void;
  isResolving: boolean;
  isDeleting: boolean;
}

const renderDetailList = (title: string, items?: DetailListItem[] | null) => (
  <div className="space-y-2">
    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
    {items && items.length ? (
      <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
        {items.map((item) => (
          <li key={item.id ?? item.text}>{item.text}</li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-muted-foreground">Not provided.</p>
    )}
  </div>
);

const ReportDetailsDialog: React.FC<ReportDetailsDialogProps> = ({
  open,
  onOpenChange,
  report,
  jobDetail,
  isJobLoading,
  isJobError,
  jobError,
  onResolve,
  onDeleteJob,
  isResolving,
  isDeleting,
}) => {
  const jobId = report?.job?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Details</DialogTitle>
          <DialogDescription>
            Review the report information and take appropriate moderation action.
          </DialogDescription>
        </DialogHeader>

        {report ? (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Job</h3>
                <p className="mt-1 text-base font-medium text-foreground">
                  {report.job?.title ?? "Unknown job"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {report.job?.hr?.companyName ?? "Unassigned"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Reporter</h3>
                <p className="mt-1 text-base font-medium text-foreground">
                  {report.user?.name ?? "Unknown reporter"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {report.user?.email ?? "No email available"}
                </p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Reason</h3>
              <p className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-foreground">
                {report.reason}
              </p>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Submitted</span>
                <br />
                {formatDateTime(report.createdAt)}
              </div>
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Report ID</span>
                <br />
                {report.id}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Job Overview</h3>
              {jobId ? (
                isJobLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : isJobError ? (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      {jobError instanceof Error
                        ? jobError.message
                        : "Unable to load job details."}
                    </span>
                  </div>
                ) : jobDetail ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {jobDetail.jobType ? <Badge variant="outline">{jobDetail.jobType}</Badge> : null}
                      {jobDetail.workArrangement ? (
                        <Badge variant="outline">{jobDetail.workArrangement}</Badge>
                      ) : null}
                      {jobDetail.duration ? <Badge variant="outline">{jobDetail.duration}</Badge> : null}
                    </div>

                    <p className="text-sm leading-relaxed text-foreground">
                      {jobDetail.description ?? "No description provided."}
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Location
                        </span>
                        <p className="text-sm font-medium text-foreground">
                          {jobDetail.location ?? "Not specified"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Salary Range
                        </span>
                        <p className="text-sm font-medium text-foreground">
                          {formatSalary(jobDetail.minSalary, jobDetail.maxSalary)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Application Deadline
                        </span>
                        <p className="text-sm font-medium text-foreground">
                          {formatDeadline(jobDetail.application_deadline)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Contact
                        </span>
                        <div className="text-sm text-foreground">
                          {jobDetail.email ? <p>Email: {jobDetail.email}</p> : null}
                          {jobDetail.phone_number ? <p>Phone: {jobDetail.phone_number}</p> : null}
                          {jobDetail.other_contact_information ? (
                            <p>{jobDetail.other_contact_information}</p>
                          ) : null}
                          {!jobDetail.email &&
                          !jobDetail.phone_number &&
                          !jobDetail.other_contact_information ? (
                            <p className="text-muted-foreground">No contact details provided.</p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {jobDetail.tags && jobDetail.tags.length ? (
                      <div className="flex flex-wrap gap-2">
                        {jobDetail.tags.map((tag) => (
                          <Badge key={tag.id} variant="secondary">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2">
                      {renderDetailList("Requirements", jobDetail.requirements)}
                      {renderDetailList("Responsibilities", jobDetail.responsibilities)}
                      {renderDetailList("Qualifications", jobDetail.qualifications)}
                      {renderDetailList("Benefits", jobDetail.benefits)}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Job details are not available.</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Job reference is unavailable for this report.
                </p>
              )}
            </section>
          </div>
        ) : null}

        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isResolving || isDeleting}>
            Close
          </Button>
          {report ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={onResolve} disabled={isResolving || !report.id}>
                {isResolving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Mark as Resolved
              </Button>
              <Button variant="destructive" onClick={onDeleteJob} disabled={isDeleting || !jobId}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete Job & Resolve
              </Button>
            </div>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDetailsDialog;
