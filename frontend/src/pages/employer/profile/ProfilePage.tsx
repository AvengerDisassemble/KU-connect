"use client";

import { useState } from "react";
import { toast } from "sonner";
import EmployerSidebar from "@/components/EmployerSideBar";
import CompanyInfoForm, { type CompanyForm } from "@/pages/employer/profile/components/CompanyInfoForm";
import VerificationChecklist, { type VerificationItem } from "@/pages/employer/profile/components/CompanyVerificationChecklist";
import CompanyDocumentUpload from "@/pages/employer/profile/components/CompanyDocumentUpload";

export default function EmployerProfilePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Mock checklist
  const verificationItems: VerificationItem[] = [
    { id: "1", title: "Company Information", description: "Basic company details completed", status: "completed" },
    { id: "2", title: "Contact Details", description: "Email and phone verification completed", status: "completed" },
    { id: "3", title: "Business Registration", description: "Upload required documents", status: "waiting" },
    { id: "4", title: "Admin Review", description: "Awaiting verification approval", status: "waiting" },
  ];

  // Mock company data (prefill)
  const initialCompanyData: CompanyForm = {
    companyName: "Kasetsart Tech",
    industry: "software",
    companySize: "51-200",
    website: "",
    description: "A KU-based startup connecting students with opportunities.",
    contactEmail: "hr@kasetsart-tech.example.com",
    phoneNumber: "0812345678",
    address: "50 Ngamwongwan Rd, Bangkok, Thailand",
  };

  // Save company info
  const handleSaveCompany = async (data: CompanyForm) => {
    try {
      console.log("Saving company profile:", data);
      // TODO: await fetch('/api/employers/me/contact', { method:'PUT', body: JSON.stringify(data) })
      toast.success("Company information saved!");
    } catch (e) {
      toast.error("Save failed. Please try again.");
    }
  };

  // Upload document handlers
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, JPG, or PNG file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB.");
      return;
    }
    setUploadedFile(file);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    toast.info("File removed");
  };

  const handleSubmitVerification = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a document before submitting.");
      return;
    }
    try {
      console.log("Submitting verification with file:", uploadedFile);
      toast.success("Verification submitted!");
    } catch (e) {
      toast.error("Submission failed. Please try again.");
    }
  };

  return (
    <>
      {/* background */}
      <div className="fixed inset-0 -z-50 pointer-events-none bg-bg-1" />

      {/* sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 w-[280px]">
        <EmployerSidebar />
      </aside>

      {/* main */}
      <main className="min-h-screen pl-[280px] p-6">
        <div className="max-w-6xl mx-auto">
          {/* header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-6">
              Company Profile & Verification
            </h1>
            <p className="text-muted-foreground">
              Manage your company information and verification status
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* left: form + upload */}
            <div className="lg:col-span-2 space-y-6">
              <CompanyInfoForm initial={initialCompanyData} onSave={handleSaveCompany} />

              <CompanyDocumentUpload
                uploadedFile={uploadedFile}
                onFileChange={handleFileChange}
                onRemoveFile={handleRemoveFile}
                onSubmit={handleSubmitVerification}
              />
            </div>

            {/* right: checklist */}
            <div className="lg:col-span-1">
              <VerificationChecklist items={verificationItems} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
