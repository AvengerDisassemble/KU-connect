import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { login, registerEmployer } from "@/services/auth";
import {
  INDUSTRY_OPTIONS_BASE,
  INDUSTRY_UI_TO_API,
} from "@/lib/domain/industries";
import {
  COMPANY_SIZE_OPTIONS,
  COMPANY_SIZE_UI_TO_API,
} from "@/lib/domain/companySize";
import {
  updateEmployerProfile,
  type UpdateEmployerProfileRequest,
} from "@/services/employerProfile";
import { EMPLOYER_PROFILE_DRAFT_KEY } from "@/lib/constants/storageKeys";

const PASSWORD_RULES = [
  {
    id: "length",
    message: "Password must be more than 8 characters",
    test: (value: string) => value.length > 8,
  },
  {
    id: "lowercase",
    message: "Password must contain at least one lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: "uppercase",
    message: "Password must contain at least one uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
] as const;

const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .superRefine((value, ctx) => {
    const failingRule = PASSWORD_RULES.find((rule) => !rule.test(value));
    if (failingRule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: failingRule.message,
      });
    }
  });

const step1Schema = z
  .object({
    name: z.string().min(2, "First name must be at least 2 characters").max(50),
    surname: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50),
    email: z.string().email("Invalid email address").max(255),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const step2Schema = z.object({
  companyName: z.string().min(2, "Company name is required").max(100),
  address: z.string().min(5, "Address must be at least 5 characters").max(255),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  industry: z.string().optional(),
  companySize: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val || COMPANY_SIZE_OPTIONS.some((option) => option.value === val),
      "Invalid company size"
    ),
});

const REQUIRED_FIELDS: (keyof FormData)[] = [
  "name",
  "surname",
  "email",
  "password",
  "companyName",
  "address",
  "phoneNumber",
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const PHONE_REGEX = /^[0-9+\-()\s]{8,15}$/;

const RequiredLabel = ({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) => (
  <Label htmlFor={htmlFor} aria-required className="text-sm sm:text-base">
    {children}
    <span className="text-destructive"> *</span>
  </Label>
);

const step3Schema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(
      /^[0-9+\-()\s]{8,15}$/,
      "Phone number must be 8-15 characters and contain only numbers, +, -, (), and spaces"
    ),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

interface FormData {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  address: string;
  description: string;
  industry: string;
  companySize: string;
  phoneNumber: string;
  website: string;
}

const getPasswordStrength = (password: string) => {
  if (password.length === 0) return { strength: 0, label: "" };
  if (password.length < 8) return { strength: 25, label: "Weak" };
  if (password.length < 12) return { strength: 50, label: "Fair" };
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
    return { strength: 50, label: "Fair" };
  return { strength: 100, label: "Strong" };
};

const getFieldValidationMessage = (field: keyof FormData, value: string): string => {
  const trimmed = value.trim();
  switch (field) {
    case "name":
      if (!trimmed) return "First name is required";
      if (trimmed.length < 2)
        return "First name must be at least 2 characters";
      return "";
    case "surname":
      if (!trimmed) return "Last name is required";
      if (trimmed.length < 2)
        return "Last name must be at least 2 characters";
      return "";
    case "email":
      if (!trimmed) return "Email is required";
      if (!EMAIL_REGEX.test(trimmed)) return "Invalid email address";
      return "";
    case "password": {
      if (!trimmed) return "Password is required";
      const failingRule = PASSWORD_RULES.find((rule) => !rule.test(trimmed));
      return failingRule ? failingRule.message : "";
    }
    case "companyName":
      if (!trimmed) return "Company name is required";
      if (trimmed.length < 2)
        return "Company name must be at least 2 characters";
      return "";
    case "address":
      if (!trimmed) return "Address is required";
      if (trimmed.length < 5)
        return "Address must be at least 5 characters";
      return "";
    case "phoneNumber":
      if (!trimmed) return "Phone number is required";
      if (!PHONE_REGEX.test(trimmed))
        return "Phone number must be 8-15 characters and contain only numbers, +, -, (), and spaces";
      return "";
    default:
      return "";
  }
};

const getConfirmPasswordMessage = (password: string, confirmPassword: string) => {
  if (!confirmPassword.trim()) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return "";
};

const EmployerRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    address: "",
    description: "",
    industry: "",
    companySize: "",
    phoneNumber: "",
    website: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const passwordStrength = getPasswordStrength(formData.password);
  const passwordRuleViolations =
    formData.password.length > 0
      ? PASSWORD_RULES.filter((rule) => !rule.test(formData.password))
      : [];
  const getFieldValue = (field: keyof FormData) => formData[field] ?? "";
  const stepOneFields: (keyof FormData)[] = [
    "name",
    "surname",
    "email",
    "password",
    "confirmPassword",
  ];
  const isStepOneReady = stepOneFields.every(
    (field) => !getFieldValidationMessage(field, getFieldValue(field))
  );
  const requiredFieldsValid = REQUIRED_FIELDS.every(
    (field) => !getFieldValidationMessage(field, getFieldValue(field))
  );
  const passwordAssistiveIds: string[] = [];
  if (formData.password) {
    passwordAssistiveIds.push("password-strength");
  }
  if (passwordRuleViolations.length > 0) {
    passwordAssistiveIds.push("password-helper");
  }
  const passwordAriaDescribedBy = errors.password
    ? "password-error"
    : passwordAssistiveIds.join(" ") || undefined;

  // Focus management when step changes
  useEffect(() => {
    if (stepContainerRef.current) {
      const firstInput = stepContainerRef.current.querySelector<
        HTMLInputElement | HTMLButtonElement
      >("input, button");
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [currentStep]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const message = getFieldValidationMessage(field, value);
    setErrors((prev) => ({ ...prev, [field]: message }));

    if (field === "password" || field === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: getConfirmPasswordMessage(
          field === "password" ? value : formData.password,
          field === "confirmPassword" ? value : formData.confirmPassword
        ),
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    try {
      if (step === 1) {
        step1Schema.parse({
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
      } else if (step === 2) {
        step2Schema.parse({
          companyName: formData.companyName,
          address: formData.address,
          description: formData.description,
          industry: formData.industry,
          companySize: formData.companySize,
        });
      } else if (step === 3) {
        step3Schema.parse({
          phoneNumber: formData.phoneNumber,
          website: formData.website,
        });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const field = issue.path[0];
          if (field !== undefined) {
            fieldErrors[String(field)] = issue.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please fix the errors before continuing");
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setDirection("forward");
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setDirection("backward");
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (isSubmitting || !validateStep(3)) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const industryValue = formData.industry
        ? INDUSTRY_UI_TO_API[formData.industry]
        : undefined;
      const companySizeValue = formData.companySize
        ? COMPANY_SIZE_UI_TO_API[formData.companySize]
        : undefined;
      const websiteValue = formData.website.trim();
      const descriptionValue = formData.description.trim();

      const payload = {
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email.trim(),
        password: formData.password,
        companyName: formData.companyName.trim(),
        address: formData.address.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        ...(industryValue ? { industry: industryValue } : {}),
      };

      const response = await registerEmployer(payload);
      const successMessage =
        (response as { message?: string })?.message ||
        "Registration submitted! Awaiting verification.";
      toast.success(successMessage);

      try {
        const loginResult = await login(payload.email, payload.password);
        const { user } = loginResult.data;
        const userId = user?.id;

        const profilePayload: UpdateEmployerProfileRequest = {};
        if (industryValue) profilePayload.industry = industryValue;
        if (companySizeValue) profilePayload.companySize = companySizeValue;
        if (websiteValue) profilePayload.website = websiteValue;
        if (descriptionValue) profilePayload.description = descriptionValue;

        let draftForPrefill: Partial<UpdateEmployerProfileRequest> | null =
          null;
        if (Object.keys(profilePayload).length > 0) {
          try {
            await updateEmployerProfile(profilePayload);
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(EMPLOYER_PROFILE_DRAFT_KEY);
            }
          } catch (profileError) {
            console.error("Failed to sync employer details:", profileError);
            toast.error(
              "Profile saved without extras. Update details from your profile."
            );
            draftForPrefill = {
              industry: formData.industry,
              companySize: formData.companySize,
              website: formData.website,
              description: formData.description,
            };
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                EMPLOYER_PROFILE_DRAFT_KEY,
                JSON.stringify(draftForPrefill)
              );
            }
          }
        }

        navigate(
          userId ? `/employer/profile/${userId}` : "/employer",
          { replace: true }
        );
      } catch (authError) {
        console.error("Auto-login failed after registration:", authError);
        toast.info("Registration complete. Please log in to continue.");
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Employer registration failed:", error);
      let message =
        error instanceof Error ? error.message : "Failed to register employer";

      const details = (error as Error & { errors?: unknown }).errors;
      if (Array.isArray(details) && details.length > 0) {
        message = `${message}: ${details.join(", ")}`;
      }

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 3) * 100;
  const animationClass =
    direction === "forward"
      ? "animate-slide-in-right"
      : "animate-slide-in-left";

  return (
    <div
      className="space-y-6"
      role="region"
      aria-label="Employer registration form"
    >
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {Object.keys(errors).length > 0 &&
          "Form has errors. Please review and correct."}
        Step {currentStep} of 3
      </div>
      {/* Progress Indicator */}
      <div
        className="space-y-2"
        role="group"
        aria-label="Registration progress"
      >
        <div className="flex justify-between text-sm font-medium">
          <span
            className="text-muted-foreground"
            aria-label={`Current step: ${currentStep} of 3`}
          >
            Step {currentStep} of 3
          </span>
          <span
            className="text-primary"
            aria-label={`${Math.round(progress)} percent complete`}
          >
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress
          value={progress}
          className="h-2"
          aria-label="Overall progress"
        />
      </div>

      <div ref={stepContainerRef} className={animationClass}>
        {/* Step 1: Account Owner */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
            <RequiredLabel htmlFor="name">First Name</RequiredLabel>
                <Input
                  id="name"
                  placeholder="Enter your first name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`h-11 sm:h-12 ${
                    errors.name ? "border-destructive" : ""
                  }`}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  required
                />
                {errors.name && (
                  <p
                    id="name-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
            <RequiredLabel htmlFor="surname">Last Name</RequiredLabel>
                <Input
                  id="surname"
                  placeholder="Enter your last name"
                  value={formData.surname}
                  onChange={(e) => handleInputChange("surname", e.target.value)}
                  className={`h-11 sm:h-12 ${
                    errors.surname ? "border-destructive" : ""
                  }`}
                  aria-invalid={!!errors.surname}
                  aria-describedby={
                    errors.surname ? "surname-error" : undefined
                  }
                  required
                />
                {errors.surname && (
                  <p
                    id="surname-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.surname}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
            <RequiredLabel htmlFor="email">Work Email</RequiredLabel>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`h-11 sm:h-12 ${
                  errors.email ? "border-destructive" : ""
                }`}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                required
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
            <RequiredLabel htmlFor="password">Password</RequiredLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                onChange={(e) =>
                  handleInputChange("password", e.target.value)
                }
                className={`h-11 sm:h-12 ${
                  errors.password ? "border-destructive pr-10" : "pr-10"
                }`}
                aria-invalid={!!errors.password}
                aria-describedby={passwordAriaDescribedBy}
                required
              />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="space-y-1" id="password-strength">
                  <div
                    className="h-1.5 w-full bg-muted rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={passwordStrength.strength}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.strength === 100
                          ? "bg-accent"
                          : passwordStrength.strength >= 50
                          ? "bg-secondary"
                          : "bg-destructive"
                      }`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password strength:{" "}
                    <span className="font-medium">
                      {passwordStrength.label}
                    </span>
                  </p>
                </div>
              )}
              {formData.password && passwordRuleViolations.length > 0 && (
                <ul
                  id="password-helper"
                  className="text-xs text-destructive space-y-0.5"
                  role="alert"
                >
                  {passwordRuleViolations.map((rule) => (
                    <li key={rule.id}>{rule.message}</li>
                  ))}
                </ul>
              )}
              {errors.password && (
                <p
                  id="password-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm sm:text-base">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                className={`h-11 sm:h-12 ${
                  errors.confirmPassword ? "border-destructive" : ""
                }`}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "confirm-password-error" : undefined
                }
                required
              />
              {formData.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <p
                    id="password-match"
                    className="text-sm text-accent flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    Passwords match
                  </p>
                )}
              {errors.confirmPassword && (
                <p
                  id="confirm-password-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              onClick={handleNext}
              className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!isStepOneReady}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Company Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tell us about your organization. Company name and address are
              required for verification.
            </p>

            <div className="space-y-2">
              <RequiredLabel htmlFor="companyName">
                Company Name
              </RequiredLabel>
              <Input
                id="companyName"
                placeholder="Your company name"
                value={formData.companyName}
                onChange={(e) =>
                  handleInputChange("companyName", e.target.value)
                }
                className={`h-11 sm:h-12 ${
                  errors.companyName ? "border-destructive" : ""
                }`}
                aria-invalid={!!errors.companyName}
                aria-describedby={
                  errors.companyName ? "company-error" : undefined
                }
                required
              />
              {errors.companyName && (
                <p
                  id="company-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.companyName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="address">
                Company Address
              </RequiredLabel>
              <Textarea
                id="address"
                placeholder="Registered business address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                rows={3}
                className={`${errors.address ? "border-destructive" : ""}`}
                required
              />
              {errors.address && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.address}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm sm:text-base">
                Company Description
              </Label>
              <Textarea
                id="description"
                placeholder="Tell us about your company..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={4}
                maxLength={500}
                className={`${errors.description ? "border-destructive" : ""}`}
                aria-describedby="description-count"
              />
              <p
                id="description-count"
                className="text-xs text-muted-foreground text-right"
              >
                {formData.description.length}/500
              </p>
              {errors.description && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry" className="text-sm sm:text-base">
                Industry
              </Label>
              <Select
                value={formData.industry}
                onValueChange={(v) => handleInputChange("industry", v)}
              >
                <SelectTrigger id="industry" className="h-11 sm:h-12">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS_BASE.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize" className="text-sm sm:text-base">
                Company Size
              </Label>
              <Select
                value={formData.companySize}
                onValueChange={(v) => handleInputChange("companySize", v)}
              >
                <SelectTrigger id="companySize" className="h-11 sm:h-12">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-11 sm:h-12 touch-manipulation"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 h-11 sm:h-12 bg-primary hover:bg-primary/90 touch-manipulation"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Verification */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="phoneNumber">
                Phone Number
              </RequiredLabel>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+66 12 345 6789"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                className={`h-11 sm:h-12 ${
                  errors.phoneNumber ? "border-destructive" : ""
                }`}
                aria-invalid={!!errors.phoneNumber}
                aria-describedby={
                  errors.phoneNumber ? "phone-error" : undefined
                }
              />
              {errors.phoneNumber && (
                <p
                  id="phone-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm sm:text-base">
                Website
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://www.company.com"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                className={`h-11 sm:h-12 ${
                  errors.website ? "border-destructive" : ""
                }`}
                aria-invalid={!!errors.website}
                aria-describedby={errors.website ? "website-error" : undefined}
              />
              {errors.website && (
                <p
                  id="website-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.website}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              A company logo and a business registration document can be uploaded after you sign in
              to the employer profile.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-11 sm:h-12 touch-manipulation"
                disabled={isSubmitting}
              >
                Back
              </Button>
              
              <Button
                onClick={handleSubmit}
                className="flex-1 h-11 sm:h-12 bg-primary hover:bg-primary/90 touch-manipulation"
                disabled={isSubmitting || !requiredFieldsValid}
              >
                {isSubmitting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerRegistration;
