import { ArrowRightCircle } from "lucide-react";

import type { JobReportItem } from "@/services/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString();

interface ReportTableProps {
  reports: JobReportItem[];
  isLoading: boolean;
  searchEmpty: boolean;
  onViewDetails: (report: JobReportItem) => void;
}

const ReportTable: React.FC<ReportTableProps> = ({
  reports,
  isLoading,
  searchEmpty,
  onViewDetails,
}) => {
  return (
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
        ) : reports.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
              {searchEmpty ? "No reports match the current filters." : "No reports found."}
            </TableCell>
          </TableRow>
        ) : (
          reports.map((report) => (
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
                <p className="line-clamp-3 break-words text-muted-foreground">{report.reason}</p>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(report.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="link" className="gap-2 text-primary" onClick={() => onViewDetails(report)}>
                  View Details
                  <ArrowRightCircle className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default ReportTable;
