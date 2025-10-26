"use client";

import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import EmployerSidebar from "@/components/EmployerSideBar";
import CompanyInfoForm from "@/pages/employer/profile/components/CompanyInfoForm";
import VerificationChecklist, {
  type VerificationItem,
} from "@/pages/employer/profile/components/CompanyVerificationChecklist";
import CompanyDocumentUpload from "@/pages/employer/profile/components/CompanyDocumentUpload";

export default function EmployerProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // mock checklist
  const verificationItems: VerificationItem[] = [
    {
      id: "1",
      title: "Company Information",
      description: "Basic company details completed",
      status: "completed",
    },
    {
      id: "2",
      title: "Contact Details",
      description: "Email and phone verification completed",
      status: "completed",
    },
    {
      id: "3",
      title: "Business Registration",
      description: "Upload required documents",
      status: "waiting",
    },
    {
      id: "4",
      title: "Admin Review",
      description: "Awaiting verification approval",
      status: "waiting",
    },
  ];

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
  const handleRemoveFile = () => {
    setUploadedFile(null);
    toast.info("File removed");
  };
  const handleSubmitVerification = async () => {
    if (!uploadedFile)
      return toast.error("Please upload a document before submitting.");
    toast.success("Verification submitted!");
  };

  return (
    <>
      <div className="fixed inset-0 -z-50 pointer-events-none bg-background" />

      <aside className="fixed inset-y-0 left-0 z-20 w-[280px]">
        <EmployerSidebar />
      </aside>

      <main className="min-h-screen pl-[280px] p-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-6">
              Company Profile & Verification
            </h1>
            <p className="text-muted-foreground">
              Manage your company information and verification status
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <CompanyInfoForm userId={userId} />

              <CompanyDocumentUpload
                uploadedFile={uploadedFile}
                onFileChange={handleFileChange}
                onRemoveFile={handleRemoveFile}
                onSubmit={handleSubmitVerification}
              />
            </div>

            <div className="lg:col-span-1">
              <VerificationChecklist items={verificationItems} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
