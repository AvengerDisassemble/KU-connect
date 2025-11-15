import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flag, AlertTriangle, Loader2 } from "lucide-react";
import { reportJob, type JobReportPayload } from "@/services/jobs";

interface ReportJobDialogProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ReportJobDialog({
  jobId,
  jobTitle,
  companyName,
  children,
  open,
  onOpenChange,
}: ReportJobDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [reason, setReason] = useState("");

  const isControlled = typeof open === "boolean";
  const dialogOpen = isControlled ? (open as boolean) : internalOpen;

  const setDialogOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const reportMutation = useMutation({
    mutationFn: (payload: JobReportPayload) => reportJob(jobId, payload),
    onSuccess: () => {
      toast.success("Job reported successfully. We'll review it shortly.");
      setDialogOpen(false);
      setReason("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to report job. Please try again."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please provide a reason for reporting this job.");
      return;
    }

    if (reason.trim().length < 10) {
      toast.error("Report reason must be at least 10 characters long.");
      return;
    }

    if (reason.trim().length > 300) {
      toast.error("Report reason cannot exceed 300 characters.");
      return;
    }

    const payload: JobReportPayload = {
      reason: reason.trim(),
    };

    reportMutation.mutate(payload);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReason("");
    }
    setDialogOpen(nextOpen);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report Job Posting
          </DialogTitle>
          <DialogDescription>
            Help us keep the job board safe by reporting inappropriate or fake
            job postings. Reports are reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Job Details</Label>
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="font-medium">{jobTitle}</div>
              <div className="text-muted-foreground">{companyName}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for reporting *
              <span className="text-xs text-muted-foreground ml-2">
                (10-300 characters)
              </span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why this job posting should be reviewed..."
              rows={4}
              maxLength={300}
              className="resize-none"
              required
            />
            <div className="text-xs text-muted-foreground text-right">
              {reason.length}/300 characters
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> False reporting may result in account
              restrictions. Please only report jobs that genuinely violate our
              community guidelines.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={reportMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={reportMutation.isPending || !reason.trim()}
            >
              {reportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reporting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
