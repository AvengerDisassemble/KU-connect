import { useMemo, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getJobReports } from "@/services/admin";
import type { JobReportItem } from "@/services/admin";
import type { JobDetail } from "@/services/jobs";
import {
  getJobById,
  deleteJob as deleteJobPosting,
  deleteJobReport,
} from "@/services/jobs";
import ReportSummaryCards from "./components/ReportSummaryCards";
import ReportSearchBar from "./components/ReportSearchBar";
import ReportTable from "./components/ReportTable";
import ReportDetailsDialog from "./components/ReportDetailsDialog";

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

  const searchEmptyState = Boolean(searchTerm.trim()) && filteredReports.length === 0;

  return (
    <AdminLayout
      title="Report Management"
      description="Monitor and resolve user reports related to job postings."
    >
      <ReportSummaryCards
        totalReports={reports.length}
        unresolvedReports={filteredReports.length}
        isLoading={isLoading}
      />

      <Card>
        <CardHeader>
          <ReportSearchBar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onRefresh={() => void refetch()}
            isRefreshing={isFetching}
          />
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
            <ReportTable
              reports={filteredReports}
              isLoading={isLoading}
              searchEmpty={searchEmptyState}
              onViewDetails={handleViewDetails}
            />
          )}
        </CardContent>
      </Card>

      <ReportDetailsDialog
        open={isDialogOpen}
        onOpenChange={handleDialogChange}
        report={selectedReport}
        jobDetail={jobDetail ?? undefined}
        isJobLoading={isJobLoading}
        isJobError={isJobError}
        jobError={jobError ?? undefined}
        onResolve={handleResolveReport}
        onDeleteJob={handleDeleteJob}
        isResolving={resolveReportMutation.isPending}
        isDeleting={deleteJobMutation.isPending}
      />
    </AdminLayout>
  );
};

export default ReportManagementPage;
