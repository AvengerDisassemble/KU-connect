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

  const [formData, setFormData] = useState<JobFormState>({
    title: "",
    companyName: "",
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
        if (company) {
          setFormData(prev => ({ ...prev, companyName: company }));
          setLockCompanyName(true);
        }
      } catch (e: any) {
        console.warn("getEmployerProfile failed:", e?.message || e);
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

  /* submit */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Required checks
    const missing: string[] = [];
    if (!formData.title) missing.push("Title");
    if (!formData.description) missing.push("Description");
    if (!formData.location) missing.push("Location");
    if (!formData.jobType) missing.push("Job Type");
    if (!formData.workArrangement) missing.push("Work Arrangement");
    if (!formData.phone_number) missing.push("Phone");
    if (!formData.minSalary) missing.push("Min Salary");
    if (!formData.maxSalary) missing.push("Max Salary");
    if (!formData.duration) missing.push("Duration");
    if (!formData.application_deadline) missing.push("Application Deadline");

    if (missing.length > 0) {
      const idMap: Record<string, string> = {
        Title: "title",
        Description: "description",
        Location: "location",
        "Job Type": "jobType",
        "Work Arrangement": "workArrangement",
        Phone: "phone_number",
        "Min Salary": "minSalary",
        "Max Salary": "maxSalary",
        Duration: "duration",
        "Application Deadline": "application_deadline",
      };
      const firstId = idMap[missing[0]];
      if (firstId) document.getElementById(firstId)?.focus();

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
      document.getElementById(!Number.isFinite(min) ? "minSalary" : "maxSalary")?.focus();
      toast.error("Salary must be positive numbers", { id: REQUIRED_TOAST_ID });
      return;
    }
    if (min > max) {
      document.getElementById("minSalary")?.focus();
      toast.error("Min Salary must be less than or equal to Max Salary", { id: REQUIRED_TOAST_ID });
      return;
    }

    // Date check (yyyy-mm-dd -> T23:59:59Z)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.application_deadline)) {
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

      // Reset form
      setFormData({
        title: "",
        companyName: lockCompanyName ? (profile?.hr?.companyName ?? "") : "",
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
      setTagInput(""); setReqInput(""); setQualInput(""); setRespInput(""); setBenefitInput("");
    } catch (err: any) {
      toast.error("Failed to post job", {
        description: err?.message || "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* UI */
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
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-2"
                />
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
                  onValueChange={(value) => setFormData(prev => ({ ...prev, jobType: value }))}
                >
                  <SelectTrigger id="jobType" className="mt-2">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="fulltime">Full-time</SelectItem>
                    <SelectItem value="parttime">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel htmlFor="workArrangement" required>Work Arrangement</FieldLabel>
                <Select
                  value={formData.workArrangement}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, workArrangement: value }))}
                >
                  <SelectTrigger id="workArrangement" className="mt-2">
                    <SelectValue placeholder="Select arrangement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel htmlFor="location" required>Location</FieldLabel>
                <Input
                  id="location"
                  placeholder="e.g., Bangkok, Thailand"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="duration" required>Duration</FieldLabel>
              <Input
                id="duration"
                placeholder="e.g., 6 months, 1 year"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div>
              <FieldLabel htmlFor="description" required>Job Description</FieldLabel>
              <Textarea
                id="description"
                placeholder="What will they do day-to-day? What will they learn? What impact will they have?"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-2 min-h-[120px]"
              />
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
                  onChange={(e) => setFormData(prev => ({ ...prev, minSalary: e.target.value }))}
                  className="flex-1"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  id="maxSalary"
                  inputMode="numeric"
                  placeholder="15000"
                  value={formData.maxSalary}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxSalary: e.target.value }))}
                  className="flex-1"
                />
                <span className="text-muted-foreground font-medium">THB</span>
              </div>
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
                    addToList(benefitInput, "benefits", () => setBenefitInput(""));}
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
                  value={formData.application_deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, application_deadline: e.target.value }))}
                  className="mt-2"
                />
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
                  placeholder="+66-xxx-xxx-xxx"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="mt-2"
                />
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

        {/* Actions */}
        <div className="flex w-full items-center justify-end">
          <Button
            type="submit"
            className="px-8 bg-brand-teal hover:bg-brand-teal/90"
            disabled={submitting}
          >
            {submitting ? "Posting..." : "Post Job"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JobPostingForm;
