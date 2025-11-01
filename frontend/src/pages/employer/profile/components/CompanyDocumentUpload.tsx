"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, X } from "lucide-react";

interface Props {
  uploadedFile: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  hasExistingDocument?: boolean;
  isUploadLocked?: boolean;
  statusMessage?: string;
  isLoading?: boolean;
}

export default function CompanyDocumentUpload({
  uploadedFile,
  onFileChange,
  onRemoveFile,
  onSubmit,
  isSubmitting = false,
  hasExistingDocument = false,
  isUploadLocked = false,
  statusMessage,
  isLoading = false,
}: Props) {
  const uploadInstructions = isUploadLocked
    ? "Document uploads are disabled."
    : "PDF, JPG, PNG up to 10MB";

  return (
    <Card className="mt-6 border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Verification Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusMessage && (
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground">
            {statusMessage}
          </div>
        )}

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={onFileChange}
          className="hidden"
          id="file-upload"
          disabled={isUploadLocked}
        />

        {uploadedFile ? (
          <div className="border border-border rounded-lg p-4 flex items-center justify-between bg-card">
            <div>
              <p className="text-sm font-medium">{uploadedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemoveFile}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          </div>
        ) : (
          <label
            htmlFor="file-upload"
            className={`block border-2 border-dashed border-border rounded-lg p-12 text-center transition-colors ${
              isUploadLocked
                ? "cursor-not-allowed bg-muted/40 text-muted-foreground"
                : "cursor-pointer hover:bg-muted/40"
            }`}
          >
            <FileUp className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-foreground">
              {hasExistingDocument && !isUploadLocked
                ? "Click to replace your current document"
                : "Click to upload business registration certificate"}
            </p>
            <p className="text-xs text-muted-foreground">{uploadInstructions}</p>
          </label>
        )}

        <div className="mt-4">
          <Button
            onClick={onSubmit}
            disabled={
              isSubmitting || !uploadedFile || isUploadLocked || isLoading
            }
            className="px-8 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isSubmitting ? "Submitting..." : "Submit for Verification"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
