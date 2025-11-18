import { useMemo, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRightCircle, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getJobReports } from "@/services/admin";
import type { JobReportItem } from "@/services/admin";
import type { JobDetail } from "@/services/jobs";
import {
  getJobById,
  deleteJob as deleteJobPosting,
  deleteJobReport,
} from "@/services/jobs";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  formatSalary,
  formatDeadline,
} from "@/pages/student/browse-jobs/utils/helpers";

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString();

const filterReports = (reports: JobReportItem[], searchTerm: string) => {
  if (!searchTerm.trim()) {
    return reports;
  }

  const term = searchTerm.toLowerCase();
  return reports.filter((report) => {
    const jobTitle = report.job?.title?.toLowerCase() ?? "";
    const reason = report.reason.toLowerCase();
    const reporter = report.user?.name?.toLowerCase() ?? "";
    const email = report.user?.email?.toLowerCase() ?? "";
    return (
      jobTitle.includes(term) ||
      reason.includes(term) ||
      reporter.includes(term) ||
      email.includes(term)
    );
  });
};

const ReportManagementPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<JobReportItem | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: reports = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: getJobReports,
  });

  const filteredReports = useMemo(
    () => filterReports(reports, searchTerm),
    [reports, searchTerm]
  );

  const handleViewDetails = (report: JobReportItem) => {
    setSelectedReport(report);
    setIsDialogOpen(true);
  };

  const jobId = selectedReport?.job?.id;
  const reportId = selectedReport?.id;

  const {
    data: jobDetail,
    isLoading: isJobLoading,
    isError: isJobError,
    error: jobError,
  } = useQuery<JobDetail, Error>({
    queryKey: ["admin", "reports", "job", jobId],
    queryFn: () => getJobById(jobId ?? ""),
    enabled: Boolean(jobId),
  });

  const resolveReportMutation = useMutation({
    mutationFn: (id: string) => deleteJobReport(id),
    onSuccess: () => {
      toast.success("Report marked as resolved");
      setIsDialogOpen(false);
      setSelectedReport(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      void refetch();
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to resolve report"
      );
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async ({ job, report }: { job: string; report?: string }) => {
      if (report) {
        await deleteJobReport(report);
      }
      await deleteJobPosting(job);
    },
    onSuccess: () => {
      toast.success("Job deleted and report resolved");
      setIsDialogOpen(false);
      setSelectedReport(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      void refetch();
    },
    onError: (mutationError) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to delete job"
      );
    },
  });

  const isActionInFlight =
    resolveReportMutation.isPending || deleteJobMutation.isPending;

  const handleDialogChange = useCallback(
    (open: boolean) => {
      if (!open && isActionInFlight) {
        return;
      }
      setIsDialogOpen(open);
      if (!open) {
        setSelectedReport(null);
      }
    },
    [isActionInFlight]
  );

  const handleResolveReport = () => {
    if (!reportId) {
      return;
    }
    void resolveReportMutation.mutateAsync(reportId);
  };

  const handleDeleteJob = () => {
    if (!jobId) {
      toast.error("Job information is unavailable for this report");
      return;
    }
    void deleteJobMutation.mutateAsync({
      job: jobId,
      report: reportId ?? undefined,
    });
  };

  const renderDetailList = (
    title: string,
    items?: { id: string; text: string }[] | null
  ) => {
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h4>
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
  };

  return (
    <AdminLayout
      title="Report Management"
      description="Monitor and resolve user reports related to job postings."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Badge variant="outline">{reports.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">
              Aggregate reports filed by students or employers.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unresolved Reports
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredReports.length}</div>
            <p className="text-xs text-muted-foreground">
              Reports still awaiting moderator action.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Reported Jobs</CardTitle>
              <CardDescription>
                Investigate reported job postings and coordinate with HR teams.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                className="h-9 w-full sm:w-[280px]"
                placeholder="Search by job, reporter, or reason"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden p-0">
          {isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
              <p className="font-medium text-destructive">
                {error instanceof Error
                  ? error.message
                  : "Failed to load reports"}
              </p>
              <Button onClick={() => void refetch()} size="sm">
                Try Again
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No reports match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {report.job?.title ?? "Unknown job"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {report.job?.hr?.companyName ?? "Unassigned"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {report.user?.name ?? "Unknown reporter"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {report.user?.email ?? "No email"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[280px] text-sm">
                        <p className="line-clamp-3 break-words text-muted-foreground">
                          {report.reason}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(report.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="link"
                          className="gap-2 text-primary"
                          onClick={() => handleViewDetails(report)}
                        >
                          View Details
                          <ArrowRightCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Review the report information and take appropriate moderation
              action.
            </DialogDescription>
          </DialogHeader>

          {selectedReport ? (
            <div className="space-y-6">
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Job
                  </h3>
                  <p className="mt-1 text-base font-medium text-foreground">
                    {selectedReport.job?.title ?? "Unknown job"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReport.job?.hr?.companyName ?? "Unassigned"}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Reporter
                  </h3>
                  <p className="mt-1 text-base font-medium text-foreground">
                    {selectedReport.user?.name ?? "Unknown reporter"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReport.user?.email ?? "No email available"}
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Reason
                </h3>
                <p className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-foreground">
                  {selectedReport.reason}
                </p>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Submitted
                  </span>
                  <br />
                  {formatDateTime(selectedReport.createdAt)}
                </div>
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Report ID
                  </span>
                  <br />
                  {selectedReport.id}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Job Overview
                </h3>
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
                        {jobDetail.jobType ? (
                          <Badge variant="outline">{jobDetail.jobType}</Badge>
                        ) : null}
                        {jobDetail.workArrangement ? (
                          <Badge variant="outline">
                            {jobDetail.workArrangement}
                          </Badge>
                        ) : null}
                        {jobDetail.duration ? (
                          <Badge variant="outline">{jobDetail.duration}</Badge>
                        ) : null}
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
                            {formatSalary(
                              jobDetail.minSalary,
                              jobDetail.maxSalary
                            )}
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
                            {jobDetail.email ? (
                              <p>Email: {jobDetail.email}</p>
                            ) : null}
                            {jobDetail.phone_number ? (
                              <p>Phone: {jobDetail.phone_number}</p>
                            ) : null}
                            {jobDetail.other_contact_information ? (
                              <p>{jobDetail.other_contact_information}</p>
                            ) : null}
                            {!jobDetail.email &&
                            !jobDetail.phone_number &&
                            !jobDetail.other_contact_information ? (
                              <p className="text-muted-foreground">
                                No contact details provided.
                              </p>
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
                        {renderDetailList(
                          "Requirements",
                          jobDetail.requirements
                        )}
                        {renderDetailList(
                          "Responsibilities",
                          jobDetail.responsibilities
                        )}
                        {renderDetailList(
                          "Qualifications",
                          jobDetail.qualifications
                        )}
                        {renderDetailList("Benefits", jobDetail.benefits)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Job details are not available.
                    </p>
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
            <Button
              variant="secondary"
              onClick={() => handleDialogChange(false)}
              disabled={isActionInFlight}
            >
              Close
            </Button>

            {selectedReport ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={handleResolveReport}
                  disabled={isActionInFlight || !reportId}
                >
                  {resolveReportMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Mark as Resolved
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteJob}
                  disabled={isActionInFlight || !jobId}
                >
                  {deleteJobMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Delete Job & Resolve
                </Button>
              </div>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ReportManagementPage;
