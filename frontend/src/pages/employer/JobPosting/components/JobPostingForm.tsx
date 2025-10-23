"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

import { createJob } from "@/services/jobs";
import { getEmployerProfile, type EmployerProfileResponse } from "@/services/employerProfile";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/* UI helpers */
function FieldLabel({
  htmlFor,
  required,
  children,
  className = "text-sm font-medium",
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Label htmlFor={htmlFor} className={className} aria-required={required}>
      {children}
      {required && <span className="text-destructive"> *</span>}
    </Label>
  );
}

function Chip({ text, onRemove }: { text: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs">
      {text}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 rounded-full p-0.5 hover:bg-muted"
          aria-label={`remove ${text}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

/* Types */
type JobFormState = {
  title: string;
  companyName: string;         // view-only (prefilled)
  description: string;
  location: string;
  jobType: string;
  workArrangement: string;
  duration: string;
  tags: string[];
  minSalary: string;           // input as string → number on submit
  maxSalary: string;
  application_deadline: string; // yyyy-mm-dd
  email: string;
  phone_number: string;
  other_contact_information: string;
  requirements: string[];
  qualifications: string[];
  responsibilities: string[];
  benefits: string[];
};

type Props = { userId: string };

const REQUIRED_TOAST_ID = "job-form-required";

/* Component */
const JobPostingForm = ({ userId }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<EmployerProfileResponse | null>(null);
  const [lockCompanyName, setLockCompanyName] = useState(false);

  // field-level errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // skeleton state for initial mount
  const [initializing, setInitializing] = useState(true);

  const initialForm = (companyFromProfile: string): JobFormState => ({
    title: "",
    companyName: companyFromProfile,
    description: "",
    location: "",
    jobType: "",
    workArrangement: "",
    duration: "",
    tags: [],
    minSalary: "",
    maxSalary: "",
    application_deadline: "",
    email: "",
    phone_number: "",
    other_contact_information: "",
    requirements: [],
    qualifications: [],
    responsibilities: [],
    benefits: [],
  });

  const [formData, setFormData] = useState<JobFormState>(initialForm(""));

  // inputs for "press Enter to add"
  const [tagInput, setTagInput] = useState("");
  const [reqInput, setReqInput] = useState("");
  const [qualInput, setQualInput] = useState("");
  const [respInput, setRespInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");

  /* Prefill companyName from employer profile (read-only for display) */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getEmployerProfile(userId);
        if (cancelled) return;
        setProfile(p);
        const company = p.hr?.companyName?.trim() ?? "";
        setFormData(initialForm(company));
        setLockCompanyName(!!company);
      } catch (e: any) {
        console.warn("getEmployerProfile failed:", e?.message || e);
        setFormData(initialForm(""));
        setLockCompanyName(false);
      } finally {
        // หน่วงสั้น ๆ กัน flash
        setTimeout(() => !cancelled && setInitializing(false), 250);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  /* list helpers */
  const addToList = (
    value: string,
    key: keyof Pick<JobFormState, "tags" | "requirements" | "qualifications" | "responsibilities" | "benefits">,
    clear: () => void
  ) => {
    const v = value.trim();
    if (!v) return;
    setFormData(prev => ({ ...prev, [key]: [...(prev[key] as string[]), v] }));
    clear();
  };

  const removeFromList = (
    index: number,
    key: keyof Pick<JobFormState, "tags" | "requirements" | "qualifications" | "responsibilities" | "benefits">
  ) => {
    setFormData(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).filter((_, i) => i !== index),
    }));
  };

  /* helper: only digits for salary */
  const onlyDigits = (s: string) => s.replace(/[^\d]/g, "");

  /* -------- validation & submit ---------- */

  const validateAndGetMissing = (): string[] => {
    const missing: string[] = [];
    if (!formData.title) missing.push("title");
    if (!formData.description) missing.push("description");
    if (!formData.location) missing.push("location");
    if (!formData.jobType) missing.push("jobType");
    if (!formData.workArrangement) missing.push("workArrangement");
    if (!formData.phone_number) missing.push("phone_number");
    if (!formData.minSalary) missing.push("minSalary");
    if (!formData.maxSalary) missing.push("maxSalary");
    if (!formData.duration) missing.push("duration");
    if (!formData.application_deadline) missing.push("application_deadline");
    return missing;
  };

  const doSubmit = async () => {
    if (submitting) return;

    // Required checks
    const missing = validateAndGetMissing();
    if (missing.length > 0) {
      const errs: Record<string, string> = {};
      missing.forEach((k) => (errs[k] = "Required"));
      setFieldErrors(errs);

      const firstId = missing[0];
      document.getElementById(firstId)?.focus();

      toast.error("Please fill all required (*) fields", {
        id: REQUIRED_TOAST_ID,
        description: `Missing: ${missing.join(", ")}`,
        duration: 4000,
      });
      return;
    }

    // Numeric checks
    const min = Number(formData.minSalary);
    const max = Number(formData.maxSalary);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) {
      const which = !Number.isFinite(min) || min <= 0 ? "minSalary" : "maxSalary";
      setFieldErrors(prev => ({ ...prev, [which]: "Invalid number" }));
      document.getElementById(which)?.focus();
      toast.error("Salary must be positive numbers", { id: REQUIRED_TOAST_ID });
      return;
    }
    if (min > max) {
      setFieldErrors(prev => ({ ...prev, minSalary: "Must be ≤ Max Salary" }));
      document.getElementById("minSalary")?.focus();
      toast.error("Min Salary must be less than or equal to Max Salary", { id: REQUIRED_TOAST_ID });
      return;
    }

    // Date check (yyyy-mm-dd -> T23:59:59Z)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.application_deadline)) {
      setFieldErrors(prev => ({ ...prev, application_deadline: "Invalid date" }));
      document.getElementById("application_deadline")?.focus();
      toast.error("Invalid Application Deadline", { id: REQUIRED_TOAST_ID });
      return;
    }
    const isoDeadline = `${formData.application_deadline}T23:59:59Z`;

    // Build payload
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      jobType: formData.jobType,
      workArrangement: formData.workArrangement,
      duration: formData.duration.trim(),
      minSalary: min,
      maxSalary: max,
      application_deadline: isoDeadline,
      email: formData.email.trim() || undefined,
      phone_number: formData.phone_number.trim(),
      other_contact_information: formData.other_contact_information.trim() || undefined,
      requirements: formData.requirements.map(s => s.trim()).filter(Boolean),
      qualifications: formData.qualifications.map(s => s.trim()).filter(Boolean),
      responsibilities: formData.responsibilities.map(s => s.trim()).filter(Boolean),
      benefits: formData.benefits.map(s => s.trim()).filter(Boolean),
      tags: formData.tags.map(s => s.trim()).filter(Boolean),
    };

    try {
      setSubmitting(true);
      const res = await createJob(payload as any);
      toast.success("Job posted successfully", {
        description: res?.title ? `Created: ${res.title}` : undefined,
      });

      // reset
      setFormData(initialForm(lockCompanyName ? (profile?.hr?.companyName ?? "") : ""));
      setFieldErrors({});
      setTagInput(""); setReqInput(""); setQualInput(""); setRespInput(""); setBenefitInput("");
    } catch (err: any) {
      let message = err?.message || "Unknown error";
      message = message.replace(/^HTTP\s\d+\s*[-–]\s*/i, "");

      toast.error("Failed to post job", {
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

  /* UI */

  // initial skeleton
  if (initializing) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-bg-2 p-6">
      <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
        {/* Job Basics */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Job Details</CardTitle>
            <p className="text-muted-foreground text-sm">Tell others about this role</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="title" required>Job Title</FieldLabel>
                <Input
                  id="title"
                  placeholder="e.g., Frontend Developer Intern"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, title: e.target.value }));
                    setFieldErrors(prev => ({ ...prev, title: "" }));
                  }}
                  className={`mt-2 ${fieldErrors.title ? "border-destructive" : ""}`}
                />
                {fieldErrors.title && <p className="text-xs text-destructive mt-1">{fieldErrors.title}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
                <Input
                  id="companyName"
                  placeholder="Company (prefilled)"
                  value={formData.companyName}
                  readOnly
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FieldLabel htmlFor="jobType" required>Job Type</FieldLabel>
                <Select
                  value={formData.jobType}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, jobType: value }));
                    setFieldErrors(prev => ({ ...prev, jobType: "" }));
                  }}
                >
                  <SelectTrigger id="jobType" className={`mt-2 ${fieldErrors.jobType ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.jobType && <p className="text-xs text-destructive mt-1">{fieldErrors.jobType}</p>}
              </div>

              <div>
                <FieldLabel htmlFor="workArrangement" required>Work Arrangement</FieldLabel>
                <Select
                  value={formData.workArrangement}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, workArrangement: value }));
                    setFieldErrors(prev => ({ ...prev, workArrangement: "" }));
                  }}
                >
                  <SelectTrigger id="workArrangement" className={`mt-2 ${fieldErrors.workArrangement ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Select arrangement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on-site">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.workArrangement && <p className="text-xs text-destructive mt-1">{fieldErrors.workArrangement}</p>}
              </div>

              <div>
                <FieldLabel htmlFor="location" required>Location</FieldLabel>
                <Input
                  id="location"
                  placeholder="e.g., Bangkok, Thailand"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, location: e.target.value }));
                    setFieldErrors(prev => ({ ...prev, location: "" }));
                  }}
                  className={`mt-2 ${fieldErrors.location ? "border-destructive" : ""}`}
                />
                {fieldErrors.location && <p className="text-xs text-destructive mt-1">{fieldErrors.location}</p>}
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="duration" required>Duration</FieldLabel>
              <Input
                id="duration"
                placeholder="e.g., 6 months, 1 year"
                value={formData.duration}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, duration: e.target.value }));
                  setFieldErrors(prev => ({ ...prev, duration: "" }));
                }}
                className={`mt-2 ${fieldErrors.duration ? "border-destructive" : ""}`}
              />
              {fieldErrors.duration && <p className="text-xs text-destructive mt-1">{fieldErrors.duration}</p>}
            </div>

            <div>
              <FieldLabel htmlFor="description" required>Job Description</FieldLabel>
              <Textarea
                id="description"
                placeholder="What will they do day-to-day? What will they learn? What impact will they have?"
                value={formData.description}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                  setFieldErrors(prev => ({ ...prev, description: "" }));
                }}
                className={`mt-2 min-h-[120px] ${fieldErrors.description ? "border-destructive" : ""}`}
              />
              {fieldErrors.description && <p className="text-xs text-destructive mt-1">{fieldErrors.description}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Compensation & Tags */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Compensation & Tags</CardTitle>
            <p className="text-muted-foreground text-sm">Set a salary range and helpful tags</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <FieldLabel required>Salary Range</FieldLabel>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  id="minSalary"
                  inputMode="numeric"
                  placeholder="10000"
                  value={formData.minSalary}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, minSalary: onlyDigits(e.target.value) }));
                    setFieldErrors(prev => ({ ...prev, minSalary: "" }));
                  }}
                  className={`flex-1 ${fieldErrors.minSalary ? "border-destructive" : ""}`}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  id="maxSalary"
                  inputMode="numeric"
                  placeholder="15000"
                  value={formData.maxSalary}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, maxSalary: onlyDigits(e.target.value) }));
                    setFieldErrors(prev => ({ ...prev, maxSalary: "" }));
                  }}
                  className={`flex-1 ${fieldErrors.maxSalary ? "border-destructive" : ""}`}
                />
                <span className="text-muted-foreground font-medium">THB</span>
              </div>
              {(fieldErrors.minSalary || fieldErrors.maxSalary) && (
                <p className="text-xs text-destructive mt-1">
                  {fieldErrors.minSalary || fieldErrors.maxSalary}
                </p>
              )}
            </div>

            <div>
              <FieldLabel htmlFor="tags">Tags</FieldLabel>
              <Input
                id="tags"
                placeholder="Type a tag and press Enter (e.g., React, Python, FinTech)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToList(tagInput, "tags", () => setTagInput(""));
                  }
                }}
                className="mt-2"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map((t, idx) => (
                  <Chip key={`${t}-${idx}`} text={t} onRemove={() => removeFromList(idx, "tags")} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Details */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Role Details</CardTitle>
            <p className="text-muted-foreground text-sm">Type items and press Enter to add</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <FieldLabel htmlFor="requirements">Requirements</FieldLabel>
              <Input
                id="requirements"
                placeholder="e.g., Currently enrolled, basic Git, SQL fundamentals"
                value={reqInput}
                onChange={(e) => setReqInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToList(reqInput, "requirements", () => setReqInput(""));
                  }
                }}
                className="mt-2"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.requirements.map((t, i) => (
                  <Chip key={`req-${i}`} text={t} onRemove={() => removeFromList(i, "requirements")} />
                ))}
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="qualifications">Qualifications</FieldLabel>
              <Input
                id="qualifications"
                placeholder="e.g., GPA > 3.0, TOEIC 700+, portfolio link"
                value={qualInput}
                onChange={(e) => setQualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToList(qualInput, "qualifications", () => setQualInput(""));
                  }
                }}
                className="mt-2"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.qualifications.map((t, i) => (
                  <Chip key={`qual-${i}`} text={t} onRemove={() => removeFromList(i, "qualifications")} />
                ))}
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="responsibilities">Responsibilities</FieldLabel>
              <Input
                id="responsibilities"
                placeholder="e.g., Implement UI components, write unit tests, join daily standups"
                value={respInput}
                onChange={(e) => setRespInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToList(respInput, "responsibilities", () => setRespInput(""));
                  }
                }}
                className="mt-2"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.responsibilities.map((t, i) => (
                  <Chip key={`resp-${i}`} text={t} onRemove={() => removeFromList(i, "responsibilities")} />
                ))}
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="benefits">Benefits</FieldLabel>
              <Input
                id="benefits"
                placeholder="e.g., Health insurance, mentorship, free lunch"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToList(benefitInput, "benefits", () => setBenefitInput(""));
                  }
                }}
                className="mt-2"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.benefits.map((t, i) => (
                  <Chip key={`benefit-${i}`} text={t} onRemove={() => removeFromList(i, "benefits")} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Deadline */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Application & Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FieldLabel htmlFor="application_deadline" required>Application Deadline</FieldLabel>
                <Input
                  id="application_deadline"
                  type="date"
                  min={new Date().toISOString().slice(0,10)}
                  value={formData.application_deadline}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, application_deadline: e.target.value }));
                    setFieldErrors(prev => ({ ...prev, application_deadline: "" }));
                  }}
                  className={`mt-2 ${fieldErrors.application_deadline ? "border-destructive" : ""}`}
                />
                {fieldErrors.application_deadline && <p className="text-xs text-destructive mt-1">{fieldErrors.application_deadline}</p>}
              </div>
              <div>
                <FieldLabel htmlFor="email">Email (optional)</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="hr@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <FieldLabel htmlFor="phone_number" required>Phone</FieldLabel>
                <Input
                  id="phone_number"
                  placeholder="+66-xxxxxxxxx"
                  value={formData.phone_number}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, phone_number: e.target.value }));
                    setFieldErrors(prev => ({ ...prev, phone_number: "" }));
                  }}
                  className={`mt-2 ${fieldErrors.phone_number ? "border-destructive" : ""}`}
                />
                {fieldErrors.phone_number && <p className="text-xs text-destructive mt-1">{fieldErrors.phone_number}</p>}
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="other_contact_information">Other Contact (optional)</FieldLabel>
              <Textarea
                id="other_contact_information"
                placeholder="e.g., Line ID, LinkedIn, application form URL"
                value={formData.other_contact_information}
                onChange={(e) => setFormData(prev => ({ ...prev, other_contact_information: e.target.value }))}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Job Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {formData.title || "Job Title"}
                </h3>
                <p className="text-brand-teal font-medium">
                  {formData.companyName || "Company"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{formData.location || "Location"}</span>
                <span>•</span>
                <span>{formData.jobType || "Job Type"}</span>
                <span>•</span>
                <span>{formData.workArrangement || "Arrangement"}</span>
                <span>•</span>
                <span>
                  {formData.minSalary && formData.maxSalary
                    ? `${formData.minSalary} - ${formData.maxSalary} THB`
                    : "Salary Range"}
                </span>
                {formData.duration && (
                  <>
                    <span>•</span>
                    <span>{formData.duration}</span>
                  </>
                )}
              </div>
              {!!formData.tags.length && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((t, i) => <Chip key={`pv-tag-${i}`} text={t} />)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions: Clear + Confirm Modal */}
        <div className="flex w-full items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData(initialForm(lockCompanyName ? (profile?.hr?.companyName ?? "") : ""));
              setFieldErrors({});
            }}
            className="border-brand-teal text-brand-teal hover:text-brand-teal"
          >
            Clear Form
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                className="px-8 bg-brand-teal hover:bg-brand-teal/90"
                disabled={submitting}
              >
                {submitting ? "Posting..." : "Post Job"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Post this job?</AlertDialogTitle>
                <AlertDialogDescription>
                  Please confirm. You can edit or remove later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-brand-teal text-brand-teal hover:text-brand-teal">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => doSubmit()} className="bg-brand-teal hover:bg-brand-teal/90">
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </div>
  );
};

export default JobPostingForm;
