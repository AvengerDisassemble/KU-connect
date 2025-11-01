"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { z, ZodError } from "zod";
import {
  getEmployerProfile,
  updateEmployerProfile,
  type UpdateEmployerProfileRequest,
} from "@/services/employerProfile";
import { Edit } from "lucide-react";

const PHONE_REGEX = /^[0-9+\-()\s]{8,15}$/;

// Options + mapping (MATCH backend enum)
type Option = { value: string; label: string };

// UI values → label
const INDUSTRY_OPTIONS_BASE: Option[] = [
  { value: "it-hardware-and-devices", label: "IT Hardware & Devices" },
  { value: "it-software", label: "IT Software" },
  { value: "it-services", label: "IT Services" },
  { value: "network-services", label: "Network Services" },
  { value: "emerging-tech", label: "Emerging Tech" },
  { value: "e-commerce", label: "E-commerce" },
  { value: "other", label: "Other" },
];

// UI → API enum
const INDUSTRY_UI_TO_API: Record<string, string> = {
  "it-hardware-and-devices": "IT_HARDWARE_AND_DEVICES",
  "it-software": "IT_SOFTWARE",
  "it-services": "IT_SERVICES",
  "network-services": "NETWORK_SERVICES",
  "emerging-tech": "EMERGING_TECH",
  "e-commerce": "E_COMMERCE",
  other: "OTHER",
};

// API enum → UI (prefill)
const API_TO_INDUSTRY_UI: Record<string, string> = Object.fromEntries(
  Object.entries(INDUSTRY_UI_TO_API).map(([ui, api]) => [api, ui])
);

const COMPANY_SIZE_OPTIONS_BASE: Option[] = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "500+", label: "500+" },
];

const COMPANY_SIZE_UI_TO_API: Record<string, string> = {
  "1-10": "ONE_TO_TEN",
  "11-50": "ELEVEN_TO_FIFTY",
  "51-200": "FIFTY_ONE_TO_TWO_HUNDRED",
  "201-500": "TWO_HUNDRED_ONE_TO_FIVE_HUNDRED",
  "500+": "FIVE_HUNDRED_PLUS",
};
const API_TO_COMPANY_SIZE_UI: Record<string, string> = Object.fromEntries(
  Object.entries(COMPANY_SIZE_UI_TO_API).map(([ui, api]) => [api, ui])
);

const valuesOf = (ops: Option[]) => ops.map((o) => o.value);
const isIn = (ops: Option[], v?: string) => !!v && valuesOf(ops).includes(v);

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

// Form types
export interface CompanyForm {
  companyName: string;
  industry: string;
  companySize: string;
  website?: string;
  description?: string;
  contactEmail?: string;
  phoneNumber: string;
  address?: string;
}

// Zod schema
const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z
    .string()
    .refine(
      (v) => isIn(INDUSTRY_OPTIONS_BASE, v),
      "Industry must be selected from the list"
    ),
  companySize: z
    .string()
    .refine(
      (v) => isIn(COMPANY_SIZE_OPTIONS_BASE, v),
      "Company Size must be selected from the list"
    ),
  address: z.string().min(1, "Address is required"),
  contactEmail: z.string().email("Please enter a valid email address"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .or(z.literal("")),
  phoneNumber: z
    .string()
    .trim()
    .min(8, "Phone number must be between 8 and 15 characters")
    .max(15, "Phone number must be between 8 and 15 characters")
    .refine((val) => PHONE_REGEX.test(val), {
      message:
        "Phone number must be 8-15 characters and may include digits, spaces, +, -, ()",
    }),
});

// inline email validator (realtime)
const validateEmailInline = (
  value: string,
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
) => {
  const s = value.trim();
  if (s.length === 0) {
    setErrors((prev) => ({ ...prev, contactEmail: "" }));
    return;
  }
  const ok = z.string().email().safeParse(s).success;
  setErrors((prev) => ({
    ...prev,
    contactEmail: ok ? "" : "Please enter a valid email address",
  }));
};

export default function CompanyInfoForm({ userId }: { userId?: string }) {
  const qc = useQueryClient();

  const [formData, setFormData] = useState<CompanyForm>({
    companyName: "",
    industry: "",
    companySize: "",
    website: "",
    description: "",
    contactEmail: "",
    phoneNumber: "",
    address: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // GET profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["employerProfile", userId],
    queryFn: () => getEmployerProfile(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!profile) return;

    setFormData({
      companyName: profile.hr?.companyName ?? "",
      industry: API_TO_INDUSTRY_UI[profile.hr?.industry ?? ""] ?? "",
      companySize: API_TO_COMPANY_SIZE_UI[profile.hr?.companySize ?? ""] ?? "",
      website: profile.hr?.website ?? "",
      address: profile.hr?.address ?? "",
      description: profile.hr?.description ?? "",
      contactEmail: profile.email ?? "",
      phoneNumber: profile.hr?.phoneNumber ?? profile.phoneNumber ?? "",
    });
  }, [profile]);

  // PATCH profile
  const mutation = useMutation({
    mutationFn: (payload: UpdateEmployerProfileRequest) =>
      updateEmployerProfile(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employerProfile", userId] });
      toast.success("Profile Updated", {
        description: "Company profile has been saved.",
        duration: 3000,
      });
    },
    onError: () => {
      toast.error("Failed to update profile", {
        description: "Please try again.",
        duration: 4000,
      });
    },
  });

  const set = (k: keyof CompanyForm, v: string) =>
    setFormData((p) => ({ ...p, [k]: v }));

  const validate = () => {
    try {
      formSchema.parse({
        companyName: (formData.companyName ?? "").trim(),
        industry: formData.industry ?? "",
        companySize: formData.companySize ?? "",
        address: (formData.address ?? "").trim(),
        contactEmail: (formData.contactEmail ?? "").trim(),
        website: (formData.website ?? "").trim(),
        description: formData.description ?? "",
        phoneNumber: (formData.phoneNumber ?? "").trim(),
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const eMap: Record<string, string> = {};
        for (const issue of error.issues) {
          const field = String(issue.path?.[0] ?? "");
          if (field) eMap[field] = issue.message;
        }
        setErrors(eMap);
      } else {
        setErrors({ form: "Validation failed" });
      }
      return false;
    }
  };

  const submit = () => {
    if (!validate()) return;
    if (!userId) {
      toast.error("Missing userId in URL.");
      return;
    }
    // map UI → API
    const payload: UpdateEmployerProfileRequest = {
      companyName: formData.companyName.trim(),
      address: (formData.address ?? "").trim(),
      website: (formData.website ?? "").trim() || undefined,
      industry: INDUSTRY_UI_TO_API[formData.industry],
      companySize: COMPANY_SIZE_UI_TO_API[formData.companySize],
      description: (formData.description ?? "").trim()
        ? (formData.description ?? "").trim()
        : null,
      phoneNumber: (formData.phoneNumber ?? "").trim(),
    };
    mutation.mutate(payload);
  };

  // UI
  if (isLoading) {
    return (
      <Card className="border-none">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>Loading profile...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none">
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          {/* Profile Avatar */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-muted-foreground/30 rounded-full"></div>
              </div>
              {/* Verification badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Edit className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
          </div>
        </div>

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
          {errors.companyName && (
            <p className="text-xs text-destructive mt-1">
              {errors.companyName}
            </p>
          )}
        </div>

        {/* Industry */}
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
          {errors.industry && (
            <p className="text-xs text-destructive mt-1">{errors.industry}</p>
          )}
        </div>

        {/* Company Size */}
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
          {errors.companySize && (
            <p className="text-xs text-destructive mt-1">
              {errors.companySize}
            </p>
          )}
        </div>

        {/* Website */}
        <div>
          <FieldLabel htmlFor="website">Website</FieldLabel>
          <Input
            id="website"
            value={formData.website ?? ""}
            onChange={(e) => set("website", e.target.value)}
            className={`mt-2 ${errors.website ? "border-red-500" : ""}`}
            placeholder="https://example.com"
            inputMode="url"
            autoComplete="url"
          />
          {errors.website && (
            <p className="text-xs text-destructive mt-1">{errors.website}</p>
          )}
        </div>

        {/* Company Description */}
        <div>
          <FieldLabel htmlFor="description">Company Description</FieldLabel>
          <Textarea
            id="description"
            value={formData.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            className="mt-2 min-h-[100px]"
            placeholder="Tell students about your company culture, mission, and values."
          />
          {errors.description && (
            <p className="text-xs text-destructive mt-1">
              {errors.description}
            </p>
          )}
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
            onChange={(e) => {
              const v = e.target.value;
              set("contactEmail", v);
              validateEmailInline(v, setErrors); // realtime
            }}
            onBlur={(e) => validateEmailInline(e.target.value, setErrors)}
            className={`mt-2 ${errors.contactEmail ? "border-red-500" : ""}`}
            placeholder="hr@company.com"
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(errors.contactEmail)}
            aria-describedby={
              errors.contactEmail ? "contact-email-error" : undefined
            }
          />
          {errors.contactEmail && (
            <p
              id="contact-email-error"
              className="text-xs text-destructive mt-1"
            >
              {errors.contactEmail}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <FieldLabel htmlFor="phoneNumber" required>
            Phone Number
          </FieldLabel>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber ?? ""}
            onChange={(e) => set("phoneNumber", e.target.value)}
            className={`mt-2 ${errors.phoneNumber ? "border-red-500" : ""}`}
            inputMode="tel"
            autoComplete="tel"
            placeholder="e.g. 081-234-5678"
          />
          {errors.phoneNumber && (
            <p className="text-xs text-destructive mt-1">
              {errors.phoneNumber}
            </p>
          )}
        </div>

        {/* Address */}
        <div>
          <FieldLabel htmlFor="address" required>
            Address
          </FieldLabel>
          <Input
            id="address"
            value={formData.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            className={`mt-2 ${errors.address ? "border-red-500" : ""}`}
            placeholder="Registered business address"
          />
          {errors.address && (
            <p className="text-xs text-destructive mt-1">{errors.address}</p>
          )}
        </div>

        <Button
          type="button"
          onClick={submit}
          disabled={mutation.isPending}
          className="px-8 bg-primary hover:bg-brand-teal/90"
        >
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
