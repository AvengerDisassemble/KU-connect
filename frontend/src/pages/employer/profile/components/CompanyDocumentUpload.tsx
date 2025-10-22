"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, X } from "lucide-react";

interface Props {
  uploadedFile: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onSubmit: () => void;
}

export default function CompanyDocumentUpload({
  uploadedFile,
  onFileChange,
  onRemoveFile,
  onSubmit,
}: Props) {
  return (
    <Card className="mt-6 border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Verification Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={onFileChange}
          className="hidden"
          id="file-upload"
        />

        {!uploadedFile ? (
          <label
            htmlFor="file-upload"
            className="block border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:bg-muted/30"
          >
            <FileUp className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm">Click to upload business registration certificate</p>
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
          </label>
        ) : (
          <div className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{uploadedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onRemoveFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="mt-4">
          <Button
            onClick={onSubmit}
            className="px-8 bg-brand-lime hover:bg-brand-lime/90"
          >
            Submit for Verification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
