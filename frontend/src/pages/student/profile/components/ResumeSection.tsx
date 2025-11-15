import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Loader2, Upload, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  fetchResumeMetadata,
  downloadResumeFile,
  validateResumeFile,
  type ResumeMetadata,
} from "@/services/resume";
import { useResume } from "@/hooks/useResume";
import { formatBytes } from "@/utils/formatBytes";

interface ResumeSectionProps {
  userId?: string;
  resumeKey?: string | null;
  updatedAt?: string | null;
}

const formatTimestamp = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const ResumeSection = ({
  userId,
  resumeKey,
  updatedAt,
}: ResumeSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [remoteMetadata, setRemoteMetadata] = useState<ResumeMetadata | null>(
    null
  );
  const [localMetadata, setLocalMetadata] = useState<ResumeMetadata | null>(
    null
  );
  const [localUpdatedAt, setLocalUpdatedAt] = useState<string | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingUploadRef = useRef(false);
  const previousResumeKeyRef = useRef<string | null>(resumeKey ?? null);

  const { uploadResume, isUploading } = useResume(userId);

  const hasResume = Boolean(
    userId && (resumeKey || localMetadata || remoteMetadata)
  );

  const lastUpdatedLabel = useMemo(() => {
    const timestamp = remoteMetadata
      ? updatedAt ?? null
      : localMetadata
      ? localUpdatedAt
      : updatedAt ?? null;
    return formatTimestamp(timestamp);
  }, [remoteMetadata, localMetadata, updatedAt, localUpdatedAt]);

  useEffect(() => {
    if (!userId) {
      setRemoteMetadata(null);
      return;
    }

    if (!resumeKey) {
      setRemoteMetadata(null);
      setIsMetadataLoading(false);
      setMetadataError(null);
      return;
    }

    let cancelled = false;
    setIsMetadataLoading(true);
    setMetadataError(null);

    fetchResumeMetadata(userId)
      .then((data) => {
        if (cancelled) return;
        setRemoteMetadata(data);
        if (!pendingUploadRef.current) {
          setLocalMetadata(null);
          setLocalUpdatedAt(null);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load resume details.";
        setMetadataError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setIsMetadataLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId, resumeKey]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  const openFilePicker = () => {
    if (!userId) {
      toast.error("Missing user information. Please try again later.");
      return;
    }
    fileInputRef.current?.click();
  };

  const resetProgressState = () => {
    abortControllerRef.current = null;
    setUploadProgress(null);
  };

  const refreshMetadata = () => {
    if (!userId) return;
    setIsMetadataLoading(true);
    setMetadataError(null);
    fetchResumeMetadata(userId)
      .then((data) => {
        setRemoteMetadata(data);
        if (data && !pendingUploadRef.current) {
          setLocalMetadata(null);
          setLocalUpdatedAt(null);
        }
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load resume details.";
        setMetadataError(message);
      })
      .finally(() => setIsMetadataLoading(false));
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) return;

    const validation = validateResumeFile(file);
    if (!validation.valid) {
      toast.error(validation.error ?? "Invalid file selected.");
      return;
    }

    if (!uploadResume) {
      toast.error("Unable to upload resume. Please try again later.");
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setUploadProgress(0);

    try {
      await uploadResume(file, {
        signal: abortController.signal,
        onProgress: (progress) => setUploadProgress(progress),
      });
      toast.success("Resume uploaded successfully.");
      pendingUploadRef.current = true;
      setLocalMetadata({
        filename: file.name,
        contentLength: file.size,
        contentType: file.type,
      });
      setLocalUpdatedAt(new Date().toISOString());
      setRemoteMetadata(null);
      refreshMetadata();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to upload resume.";
      toast.error(message);
    } finally {
      resetProgressState();
    }
  };

  useEffect(() => {
    const previous = previousResumeKeyRef.current;
    const current = resumeKey ?? null;
    if (previous !== current) {
      previousResumeKeyRef.current = current;
      pendingUploadRef.current = false;
      setLocalMetadata(null);
      setLocalUpdatedAt(null);
    }
  }, [resumeKey]);

  const handlePreview = async () => {
    if (!userId) return;
    try {
      const { blob, filename } = await downloadResumeFile(userId);
      const previewUrl = URL.createObjectURL(blob);
      const newWindow = window.open(
        previewUrl,
        "_blank",
        "noopener,noreferrer"
      );

      if (!newWindow) {
        toast.error(
          "Your browser blocked the preview. Please allow pop-ups and try again."
        );
        URL.revokeObjectURL(previewUrl);
        return;
      }

      newWindow.addEventListener("beforeunload", () => {
        URL.revokeObjectURL(previewUrl);
      });

      newWindow.document.title = filename ?? "Resume";
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to open resume preview.";
      toast.error(message);
    }
  };

  const handleDownload = async () => {
    if (!userId) return;
    try {
      const { blob, filename } = await downloadResumeFile(userId);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename ?? "resume.pdf";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to download resume.";
      toast.error(message);
    }
  };

  const handleCancelUpload = () => {
    abortControllerRef.current?.abort();
    resetProgressState();
  };
  const activeMetadata = remoteMetadata ?? localMetadata;

  const formattedSize = useMemo(
    () => formatBytes(activeMetadata?.contentLength),
    [activeMetadata]
  );

  return (
    <Card id="resume">
      <CardHeader>
        <CardTitle className="text-xl">Resume</CardTitle>
        <CardDescription>
          Upload a PDF resume (max 10MB). Uploading a new file replaces the
          existing one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasResume ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                No resume uploaded yet
              </p>
              <p className="text-sm text-muted-foreground">
                Accepted format: PDF up to 10MB.
              </p>
            </div>
            <Button onClick={openFilePicker} disabled={!userId || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload resume
                </>
              )}
            </Button>

            {uploadProgress !== null ? (
              <div className="w-full space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    Uploading resume...
                  </span>
                  <span className="text-muted-foreground">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} />
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelUpload}
                  >
                    Cancel upload
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4 md:flex-row md:items-center md:gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>

              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {activeMetadata?.filename ?? "Resume on file"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isMetadataLoading ? (
                    "Loading details..."
                  ) : metadataError && !activeMetadata ? (
                    metadataError
                  ) : (
                    <>
                      {formattedSize ? `${formattedSize}` : "Stored securely"}
                      {activeMetadata?.contentType
                        ? ` • ${activeMetadata.contentType}`
                        : null}
                      {lastUpdatedLabel
                        ? ` • Updated ${lastUpdatedLabel}`
                        : null}
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-shrink-0 flex-col gap-2 md:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  disabled={isUploading}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isUploading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openFilePicker}
                  disabled={isUploading}
                  className={cn(
                    isUploading && "pointer-events-none opacity-80"
                  )}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Replace
                    </>
                  )}
                </Button>
              </div>
            </div>

            {uploadProgress !== null ? (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    Uploading resume...
                  </span>
                  <span className="text-muted-foreground">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} />
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelUpload}
                  >
                    Cancel upload
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </CardContent>
    </Card>
  );
};

export default ResumeSection;
