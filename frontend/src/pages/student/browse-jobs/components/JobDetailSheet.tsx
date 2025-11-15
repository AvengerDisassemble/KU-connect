import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Job, JobDetail } from "../types";
import JobDetailView from "./JobDetailView";

interface JobDetailSheetProps {
  isDetailSheetOpen: boolean;
  selectedJob: (Job | JobDetail) | null;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onApply?: (jobId: string) => void;
  isApplied?: boolean;
  isApplying?: boolean;
  onToggleSave?: (jobId: string) => void;
  isSaved?: boolean;
  isSaving?: boolean;
  isLoadingDetail?: boolean;
}

const JobDetailSheet = ({
  isDetailSheetOpen,
  selectedJob,
  onOpenChange,
  onClose,
  onApply,
  isApplied,
  isApplying,
  onToggleSave,
  isSaved,
  isSaving,
  isLoadingDetail,
}: JobDetailSheetProps) => {
  return (
    <Sheet open={isDetailSheetOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[88vh] rounded-t-3xl bg-card p-0"
        hideClose
        aria-describedby={undefined}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Job detail</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Job detail
              </span>
              <span className="text-sm font-semibold text-foreground line-clamp-1">
                {selectedJob?.title ?? ""}
              </span>
            </div>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close job detail"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
          <div className="flex-1 overflow-y-auto">
            <JobDetailView
              job={selectedJob}
              onApply={onApply}
              isApplied={isApplied}
              isApplying={isApplying}
              onToggleSave={onToggleSave}
              isSaved={isSaved}
              isSaving={isSaving}
              isLoadingDetail={isLoadingDetail}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default JobDetailSheet;
