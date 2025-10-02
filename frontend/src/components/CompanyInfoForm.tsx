"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Options for dropdowns
type Option = { value: string; label: string };

const INDUSTRY_OPTIONS_BASE: Option[] = [
  { value: "software", label: "Software Development" },
  { value: "it-services", label: "IT Services" },
  { value: "finance", label: "Finance / Fintech" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail / E-commerce" },
];

const COMPANY_SIZE_OPTIONS_BASE: Option[] = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "500+", label: "500+" },
];

// Helpers: check membership & normalize initial values
const valuesOf = (ops: Option[]) => ops.map((o) => o.value);
const isIn = (ops: Option[], v?: string) =>
  !!v && valuesOf(ops).includes(v);

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

export interface CompanyForm {
  companyName: string;
  industry: string;
  companySize: string;
  website?: string;
  description?: string;
  contactEmail?: string;
  phoneNumber?: string;
  address?: string;
}

export default function CompanyInfoForm({
  initial,
  onSave,
}: {
  initial: CompanyForm;
  onSave: (data: CompanyForm) => void;
}) {
  const [formData, setFormData] = useState<CompanyForm>(initial);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Normalize initial values to allowed options only
  useEffect(() => {
    setFormData({
      companyName: initial.companyName ?? "",
      industry: isIn(INDUSTRY_OPTIONS_BASE, initial.industry) ? initial.industry : "",
      companySize: isIn(COMPANY_SIZE_OPTIONS_BASE, initial.companySize) ? initial.companySize : "",
      website: initial.website ?? "",
      description: initial.description ?? "",
      contactEmail: initial.contactEmail ?? "",
      phoneNumber: initial.phoneNumber ?? "",
      address: initial.address ?? "",
    });
  }, [initial]);

  // Update field helper
  const set = (k: keyof CompanyForm, v: string) =>
    setFormData((p) => ({ ...p, [k]: v }));

  // Validation: required + must be in option lists
  const validate = () => {
    const required: (keyof CompanyForm)[] = [
      "companyName",
      "industry",
      "companySize",
      "description",
      "contactEmail",
    ];
    const e: Record<string, boolean> = {};

    required.forEach((k) => {
      const val = (formData[k] ?? "").toString().trim();
      if (!val) e[k as string] = true;
    });

    // strict membership checks
    if (!isIn(INDUSTRY_OPTIONS_BASE, formData.industry)) e.industry = true;
    if (!isIn(COMPANY_SIZE_OPTIONS_BASE, formData.companySize)) e.companySize = true;

    setErrors(e);

    if (Object.keys(e).length > 0) {
      const msgs = [];
      if (e.industry) msgs.push("Industry must be selected from the list");
      if (e.companySize) msgs.push("Company Size must be selected from the list");
      toast.error(
        msgs.length ? msgs.join(" • ") : "Please fill in all required fields (*)"
      );
      return false;
    }
    return true;
  };

  // Submit handler
  const submit = () => {
    if (validate()) onSave(formData);
  };

  // UI
  return (
    <Card className="border-none">
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Name */}
        <div>
          <FieldLabel htmlFor="companyName" required>
            Company Name
          </FieldLabel>
          <Input
            id="companyName"
            value={formData.companyName ?? ""}
            onChange={(e) => set("companyName", e.target.value)}
            className={`mt-2 ${errors.companyName ? "border-red-500" : ""}`}
            placeholder="e.g. Tech Solutions Co., Ltd."
          />
        </div>

        {/* Industry Dropdown (strict) */}
        <div>
          <FieldLabel htmlFor="industry" required>
            Industry
          </FieldLabel>
          <Select
            value={formData.industry || undefined}
            onValueChange={(val) => set("industry", val)}
          >
            <SelectTrigger
              id="industry"
              className={`mt-2 ${errors.industry ? "border-red-500" : ""}`}
            >
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRY_OPTIONS_BASE.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company Size Dropdown (strict) */}
        <div>
          <FieldLabel htmlFor="companySize" required>
            Company Size
          </FieldLabel>
          <Select
            value={formData.companySize || undefined}
            onValueChange={(val) => set("companySize", val)}
          >
            <SelectTrigger
              id="companySize"
              className={`mt-2 ${errors.companySize ? "border-red-500" : ""}`}
            >
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZE_OPTIONS_BASE.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Website */}
        <div>
          <FieldLabel htmlFor="website">Website</FieldLabel>
          <Input
            id="website"
            value={formData.website ?? ""}
            onChange={(e) => set("website", e.target.value)}
            className="mt-2"
            placeholder="https://example.com"
          />
        </div>

        {/* Description */}
        <div>
          <FieldLabel htmlFor="description" required>
            Company Description
          </FieldLabel>
          <Textarea
            id="description"
            value={formData.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            className={`mt-2 min-h-[100px] ${
              errors.description ? "border-red-500" : ""
            }`}
            placeholder="Brief intro about your company..."
          />
        </div>

        {/* Contact Email */}
        <div>
          <FieldLabel htmlFor="contactEmail" required>
            Contact Email
          </FieldLabel>
          <Input
            id="contactEmail"
            type="email"
            value={formData.contactEmail ?? ""}
            onChange={(e) => set("contactEmail", e.target.value)}
            className={`mt-2 ${errors.contactEmail ? "border-red-500" : ""}`}
            placeholder="hr@company.com"
          />
        </div>

        {/* Phone Number */}
        <div>
          <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber ?? ""}
            onChange={(e) => set("phoneNumber", e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Address */}
        <div>
          <FieldLabel htmlFor="address">Address</FieldLabel>
          <Input
            id="address"
            value={formData.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Submit button */}
        <Button
          type="button"
          onClick={submit}
          className="px-8 bg-brand-teal hover:bg-brand-teal-dark"
        >
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}
