"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  fetchEmployerAvatar,
  getEmployerProfile,
  updateEmployerProfile,
  uploadEmployerAvatar,
  type EmployerProfileResponse,
  type UpdateEmployerProfileRequest,
} from "@/services/employerProfile";
import {
  API_TO_INDUSTRY_UI,
  INDUSTRY_OPTIONS_BASE,
  INDUSTRY_UI_TO_API,
} from "@/lib/domain/industries";
import { z, ZodError } from "zod";

const PHONE_REGEX = /^[0-9+\-()\s]{8,15}$/;

type Option = { value: string; label: string };

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

const CompanyInfoForm: React.FC<{ userId?: string }> = ({ userId }) => {
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
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const currentAvatarUrlRef = useRef<string | null>(null);
  const previewAvatarUrlRef = useRef<string | null>(null);

  const avatarQueryKey = useMemo(
    () => ["employerAvatar", userId],
    [userId]
  );
  const previewQueryKey = useMemo(
    () => ["employerAvatarPreview", userId],
    [userId]
  );

  const {
    data: profile,
    isLoading: profileLoading,
  } = useQuery<EmployerProfileResponse>({
    queryKey: ["employerProfile", userId],
    queryFn: () => getEmployerProfile(userId!),
    enabled: !!userId,
  });

  const {
    data: avatarData,
    isFetching: avatarFetching,
    isLoading: avatarLoading,
    error: avatarQueryError,
  } = useQuery<ArrayBuffer | null>({
    queryKey: avatarQueryKey,
    queryFn: () => fetchEmployerAvatar(userId!),
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (avatarQueryError instanceof Error) {
      setAvatarError("Unable to load company logo.");
    } else {
      setAvatarError(null);
    }
  }, [avatarQueryError]);

  useEffect(() => {
    if (currentAvatarUrlRef.current) {
      URL.revokeObjectURL(currentAvatarUrlRef.current);
      currentAvatarUrlRef.current = null;
    }

    if (!avatarData) {
      setCurrentAvatarUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(new Blob([avatarData]));
    currentAvatarUrlRef.current = objectUrl;
    setCurrentAvatarUrl(objectUrl);

    return () => {
      if (currentAvatarUrlRef.current === objectUrl) {
        URL.revokeObjectURL(objectUrl);
        currentAvatarUrlRef.current = null;
      }
    };
  }, [avatarData]);

  useEffect(() => {
    return () => {
      if (currentAvatarUrlRef.current) {
        URL.revokeObjectURL(currentAvatarUrlRef.current);
        currentAvatarUrlRef.current = null;
      }
      if (previewAvatarUrlRef.current) {
        URL.revokeObjectURL(previewAvatarUrlRef.current);
        previewAvatarUrlRef.current = null;
      }
      qc.setQueryData(previewQueryKey, null);
    };
  }, [previewQueryKey, qc]);

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

  const mutation: UseMutationResult<
    EmployerProfileResponse,
    unknown,
    UpdateEmployerProfileRequest
  > = useMutation({
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

  const set = (k: keyof CompanyForm, v: string): void => {
    setFormData((prev) => ({ ...prev, [k]: v }));
  };

  const validate = (): boolean => {
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

  const handleAvatarTrigger = (): void => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file || !userId) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Use JPEG, PNG, GIF, or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be smaller than 5MB.");
      return;
    }

    setAvatarError(null);
    setPendingAvatarFile(file);

    const oldPreviewUrl = previewAvatarUrlRef.current;
    if (oldPreviewUrl) {
      URL.revokeObjectURL(oldPreviewUrl);
      previewAvatarUrlRef.current = null;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    previewAvatarUrlRef.current = localPreviewUrl;
    setPreviewAvatarUrl(localPreviewUrl);
    qc.setQueryData(previewQueryKey, localPreviewUrl);
  };

  const submit = async (): Promise<void> => {
    if (!validate()) return;
    if (!userId) {
      toast.error("Missing userId in URL.");
      return;
    }

    if (pendingAvatarFile) {
      setAvatarUploading(true);
      try {
        await uploadEmployerAvatar(pendingAvatarFile);
        const arrayBuffer = await pendingAvatarFile.arrayBuffer();
        qc.setQueryData(avatarQueryKey, arrayBuffer);
        qc.setQueryData(previewQueryKey, null);
        setPendingAvatarFile(null);
        if (previewAvatarUrlRef.current) {
          URL.revokeObjectURL(previewAvatarUrlRef.current);
          previewAvatarUrlRef.current = null;
        }
        setPreviewAvatarUrl(null);
      } catch (error) {
        console.error("Failed to upload employer avatar:", error);
        toast.error("Failed to upload logo. Please try again.");
        setAvatarUploading(false);
        return;
      }
      setAvatarUploading(false);
    }

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

  const avatarLoadingState =
    avatarLoading || avatarFetching || avatarUploading;

  const avatarInitial = useMemo(() => {
    const name =
      profile?.hr?.companyName ||
      [profile?.name, profile?.surname].filter(Boolean).join(" ");
    return name?.charAt(0)?.toUpperCase() ?? "?";
  }, [profile?.hr?.companyName, profile?.name, profile?.surname]);

  const displayedAvatarUrl = previewAvatarUrl ?? currentAvatarUrl;

  if (profileLoading) {
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
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-muted shadow-sm ring-1 ring-border">
              {avatarLoadingState ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayedAvatarUrl ? (
                <img
                  src={displayedAvatarUrl}
                  alt="Company logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                  {avatarInitial}
                </div>
              )}

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label="Upload company logo"
              />

              <button
                type="button"
                onClick={handleAvatarTrigger}
                disabled={avatarLoadingState}
                className="absolute bottom-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Upload company logo"
              >
                {avatarLoadingState ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground">
                JPG, PNG, GIF, or WebP up to 5MB.
              </p>
              {avatarError ? (
                <p className="text-xs text-destructive">{avatarError}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="companyName" required>
            Company Name
          </FieldLabel>
          <Input
            id="companyName"
            value={formData.companyName}
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

        <div>
          <FieldLabel htmlFor="industry" required>
            Industry
          </FieldLabel>
          <Select
            value={formData.industry}
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

        <div>
          <FieldLabel htmlFor="companySize" required>
            Company Size
          </FieldLabel>
          <Select
            value={formData.companySize}
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
              validateEmailInline(v, setErrors);
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
          onClick={() => {
            void submit();
          }}
          disabled={mutation.isPending || avatarUploading}
          className="px-8 bg-primary hover:bg-brand-teal/90 disabled:opacity-70"
        >
          {mutation.isPending || avatarUploading ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CompanyInfoForm;
