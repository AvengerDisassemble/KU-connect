import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, type ProfileResponse } from "@/services/profile";
import { validateResumeFile } from "@/services/resume";
import { applyToJob } from "@/services/jobs";
import { upsertJobResume, type JobResumePayload } from "@/services/jobResumes";
import type { Job } from "../types";

type ResumeMode = "profile" | "upload";

type JobApplicationDialogProps = {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied: (jobId: string) => void;
  onSubmittingChange: (isSubmitting: boolean) => void;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
};

const JobApplicationDialog = ({
  job,
  open,
  onOpenChange,
  onApplied,
  onSubmittingChange,
}: JobApplicationDialogProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [mode, setMode] = useState<ResumeMode | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const profileQuery = useQuery<ProfileResponse>({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: open && Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });

  const hasProfileResume = useMemo(() => {
    return Boolean(profileQuery.data?.student?.resumeKey);
  }, [profileQuery.data?.student?.resumeKey]);

  useEffect(() => {
    if (!open) {
      setMode(null);
      setFile(null);
      setFileError(null);
      return;
    }

    if (hasProfileResume) {
      setMode((prev) => prev ?? "profile");
    } else {
      setMode("upload");
    }
  }, [open, hasProfileResume]);

  const resetState = () => {
    setMode(null);
    setFile(null);
    setFileError(null);
    onSubmittingChange(false);
  };

  const closeDialog = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const upsertResumeMutation = useMutation<JobResumePayload, Error, ResumeMode>(
    {
      mutationFn: async (selectedMode) => {
        if (!job) {
          throw new Error("Missing job context");
        }

        if (selectedMode === "profile") {
          return upsertJobResume(job.id, { mode: "profile" });
        }

        if (!file) {
          throw new Error("Please select a PDF resume before applying.");
        }

        const validation = validateResumeFile(file);
        if (!validation.valid) {
          throw new Error(validation.error ?? "Invalid resume file");
        }

        return upsertJobResume(job.id, { mode: "upload", file });
      },
    }
  );

  const applyMutation = useMutation<{ applicationId: string }, Error, string>({
    mutationFn: async (resumeLink) => {
      if (!job) {
        throw new Error("Missing job context");
      }
      const application = await applyToJob(job.id, { resumeLink });
      return { applicationId: application.id };
    },
    onMutate: () => {
      onSubmittingChange(true);
    },
    onSettled: () => {
      onSubmittingChange(false);
    },
  });

  const handleSubmit = async () => {
    if (!job) {
      toast.error(
        "Missing job information. Please reopen the job and try again."
      );
      return;
    }

    if (!mode) {
      toast.error("Select how you'd like to provide your resume.");
      return;
    }

    setFileError(null);

    try {
      const resume = await upsertResumeMutation.mutateAsync(mode);
      await applyMutation.mutateAsync(resume.link);

      toast.success("Application submitted successfully.");
      queryClient.invalidateQueries({ queryKey: ["jobs", "list"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "saved"] });
      onApplied(job.id);
      closeDialog(false);
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.toLowerCase().includes("resume")) {
        setFileError(message);
      }
      toast.error(message);
    }
  };

  const isSubmitting =
    upsertResumeMutation.isPending || applyMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply to {job?.title ?? "this job"}</DialogTitle>
          <DialogDescription>
            Choose how you would like to submit your resume for this
            application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-3">
            <button
              type="button"
              className={cn(
                "rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                mode === "profile"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                !hasProfileResume && "pointer-events-none opacity-50"
              )}
              onClick={() => setMode("profile")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Use profile resume</p>
                  <p className="text-sm text-muted-foreground">
                    Apply with the resume saved on your student profile.
                  </p>
                </div>
                {!hasProfileResume && (
                  <span className="text-xs font-medium uppercase text-destructive">
                    Resume not found
                  </span>
                )}
              </div>
            </button>

            <button
              type="button"
              className={cn(
                "rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                mode === "upload"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => setMode("upload")}
            >
              <div>
                <p className="font-semibold">Upload a job-specific resume</p>
                <p className="text-sm text-muted-foreground">
                  Provide a tailored resume that will only be used for this job.
                </p>
              </div>
            </button>
          </div>

          <Separator />

          {mode === "upload" && (
            <div className="space-y-3">
              <Label htmlFor="job-resume-upload">Upload PDF resume</Label>
              <Input
                id="job-resume-upload"
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setFile(nextFile);
                  setFileError(null);
                }}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Maximum size 10MB. Only PDF files are supported.
              </p>
              {fileError ? (
                <p className="text-sm text-destructive">{fileError}</p>
              ) : null}
            </div>
          )}

          {mode === "profile" && !hasProfileResume && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Upload a resume to your profile first, or choose the upload option
              above.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => closeDialog(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !mode ||
              (mode === "profile" && !hasProfileResume) ||
              (mode === "upload" && !file)
            }
          >
            {isSubmitting ? "Submitting..." : "Submit application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobApplicationDialog;
