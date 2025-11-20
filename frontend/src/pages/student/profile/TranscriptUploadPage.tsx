import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle2, FileUp, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  MAX_TRANSCRIPT_SIZE_BYTES,
  TRANSCRIPT_ACCEPTED_TYPES,
  uploadTranscript,
  validateTranscriptFile,
} from "@/services/documents";

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const TranscriptUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const acceptedTypesLabel = useMemo(
    () => TRANSCRIPT_ACCEPTED_TYPES.map((type) => type.replace("application/", "").toUpperCase()).join(", "),
    []
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validation = validateTranscriptFile(file);
    if (!validation.valid) {
      setError(validation.error ?? "Invalid file");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a transcript PDF before uploading.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      await uploadTranscript(selectedFile, {
        onProgress: setProgress,
        signal: abortControllerRef.current.signal,
      });
      toast.success("Transcript uploaded successfully. Please allow admins time to verify it.");
      setSelectedFile(null);
      setProgress(100);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload transcript. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    if (uploading) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setUploading(false);
      setProgress(0);
      toast.info("Upload cancelled.");
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-0">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload your transcript</CardTitle>
          <CardDescription>
            Alumni who register without KU OAuth must upload an official transcript before their account can be approved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 p-6 text-center">
            <FileUp className="mx-auto mb-4 h-10 w-10 text-primary" />
            <p className="text-base font-medium">Drop your PDF here, or click to browse.</p>
            <p className="text-sm text-muted-foreground">
              Accepted types: {acceptedTypesLabel} · Max size: {formatBytes(MAX_TRANSCRIPT_SIZE_BYTES)}
            </p>
            <Input
              type="file"
              accept={TRANSCRIPT_ACCEPTED_TYPES.join(",")}
              onChange={handleFileChange}
              disabled={uploading}
              className="mx-auto mt-4 w-full max-w-sm cursor-pointer border border-dashed text-sm"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-primary">
                Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
              </p>
            )}
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          {uploading ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Uploading transcript…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-emerald-300/60 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-medium">
                <Shield className="h-4 w-4" />
                Why we need this
              </div>
              <p className="mt-1 text-emerald-900/80">
                Transcripts help our admins verify your alumni status. Your account stays in a pending state until the submitted
                document is reviewed.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? "Uploading…" : "Upload transcript"}
            </Button>
            {uploading ? (
              <Button type="button" variant="outline" onClick={handleCancelUpload}>
                Cancel upload
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">What happens next?</CardTitle>
          <CardDescription>Admins will review your transcript before approving alumni accounts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
            <p>We’ll email you once the verification is complete or if we need more information.</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
            <p>You can return to this page anytime to replace your transcript if needed.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranscriptUploadPage;
