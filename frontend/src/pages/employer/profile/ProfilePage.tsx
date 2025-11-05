"use client";

import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmployerPageShell from "@/components/EmployerPageShell";
import CompanyInfoForm from "@/pages/employer/profile/components/CompanyInfoForm";
import VerificationChecklist, {
  type VerificationItem,
} from "@/pages/employer/profile/components/CompanyVerificationChecklist";
import CompanyDocumentUpload from "@/pages/employer/profile/components/CompanyDocumentUpload";
import {
  uploadEmployerVerificationDocument,
  getEmployerProfile,
  type EmployerProfileResponse,
} from "@/services/employerProfile";

export default function EmployerProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const qc = useQueryClient();

  const {
    data: profile,
    isLoading: isProfileLoading,
  } = useQuery<EmployerProfileResponse>({
    queryKey: ["employerProfile", userId],
    queryFn: () => getEmployerProfile(userId!),
    enabled: !!userId,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadEmployerVerificationDocument,
    onSuccess: () => {
      const hadExistingDoc = Boolean(profile?.hr?.verificationDocKey);
      toast.success(hadExistingDoc ? "Verification updated" : "Verification submitted!", {
        description: hadExistingDoc
          ? "We replaced your previous document with the new upload."
          : "We received your document and will review it shortly.",
      });
      setUploadedFile(null);
      if (userId) {
        qc.invalidateQueries({ queryKey: ["employerProfile", userId] });
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload verification document.";
      toast.error(message);
    },
  });

  const hasVerificationDocument = Boolean(profile?.hr?.verificationDocKey);
  const isVerified = Boolean(profile?.verified);
  const hasDescription = Boolean(profile?.hr?.description?.trim());
  const hasCompanyName = Boolean(profile?.hr?.companyName?.trim());
  const hasAddress = Boolean(profile?.hr?.address?.trim());
  const hasPhoneNumber = Boolean(
    profile?.hr?.phoneNumber?.trim() ?? profile?.phoneNumber?.trim()
  );

  const verificationItems: VerificationItem[] = useMemo(() => {
    const companyInfoComplete = hasCompanyName && hasAddress && hasDescription;
    const contactInfoComplete =
      (Boolean(profile?.email) && hasPhoneNumber) ||
      (Boolean(profile?.verified) && hasPhoneNumber);
    const documentComplete = hasVerificationDocument;
    const reviewComplete = isVerified;

    return [
      {
        id: "company",
        title: "Company Information",
        description: "Basic company details completed",
        status: companyInfoComplete ? "completed" : "waiting",
      },
      {
        id: "contact",
        title: "Contact Details",
        description: "Email and phone verification completed",
        status: contactInfoComplete ? "completed" : "waiting",
      },
      {
        id: "documents",
        title: "Business Registration",
        description: "Upload required documents",
        status: documentComplete ? "completed" : "waiting",
      },
      {
        id: "review",
        title: "Admin Review",
        description: "Awaiting verification approval",
        status: reviewComplete ? "completed" : "waiting",
      },
    ];
  }, [
    hasCompanyName,
    hasAddress,
    hasDescription,
    profile?.email,
    profile?.verified,
    hasPhoneNumber,
    hasVerificationDocument,
    isVerified,
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type))
      return toast.error("Please upload a PDF, JPG, or PNG file.");
    if (file.size > 10 * 1024 * 1024)
      return toast.error("File size must be less than 10MB.");
    setUploadedFile(file);
  };
  const handleRemoveFile = (): void => {
    setUploadedFile(null);
    toast.info("File removed");
  };
  const isUploadLocked = isVerified;
  const uploadStateMessage = (() => {
    if (isUploadLocked) {
      return "Your verification has been approved. Uploads are disabled.";
    }
    if (hasVerificationDocument) {
      return "Document submitted. Uploading a new file will replace the existing one.";
    }
    return "Upload a business registration certificate to begin verification.";
  })();

  const handleSubmitVerification = async (): Promise<void> => {
    if (!uploadedFile) {
      toast.error("Please upload a document before submitting.");
      return;
    }

    if (isUploadLocked) {
      toast.info("Verification already approved.");
      return;
    }

    uploadMutation.mutate(uploadedFile);
  };

  return (
    <EmployerPageShell
      title="Company Profile"
      backgroundClassName="bg-background"
      contentClassName="bg-muted/20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="mb-6 text-3xl font-bold text-foreground">
            Company Profile & Verification
          </h1>
          <p className="text-muted-foreground">
            Manage your company information and verification status
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <CompanyInfoForm userId={userId} />

            <CompanyDocumentUpload
              uploadedFile={uploadedFile}
              onFileChange={handleFileChange}
              onRemoveFile={handleRemoveFile}
              onSubmit={handleSubmitVerification}
              isSubmitting={uploadMutation.isPending}
              hasExistingDocument={hasVerificationDocument}
              isUploadLocked={isUploadLocked}
              statusMessage={uploadStateMessage}
              isLoading={isProfileLoading}
            />
          </div>

          <div className="lg:col-span-1">
            <VerificationChecklist items={verificationItems} />
          </div>
        </div>
      </div>
    </EmployerPageShell>
  );
}
