import { useState, useEffect, useRef } from "react";
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
import { CheckCircle2, Upload, X, FileText, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { registerEmployer } from "@/services/auth";

const step1Schema = z
  .object({
    name: z.string().min(2, "First name must be at least 2 characters").max(50),
    surname: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50),
    email: z.string().email("Invalid email address").max(255),
    password: z.string().min(8, "Password must be at least 8 characters"),
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
});

const fileSchema = z
  .any()
  .refine(
    (value) =>
      value === null ||
      value === undefined ||
      (typeof File !== "undefined" && value instanceof File),
    { message: "Invalid file type" }
  )
  .optional();

const step3Schema = z.object({
  contactEmail: z
    .string()
    .email("Invalid email address")
    .max(255)
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(
      /^[0-9+\s\-()]*$/,
      "Phone number must contain only digits and valid separators"
    )
    .min(9, "Phone number must be at least 9 digits")
    .max(20, "Phone number must not exceed 20 digits")
    .optional()
    .or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  proofFile: fileSchema,
});

interface FormData {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  address: string;
  logo: File | null;
  description: string;
  industry: string;
  contactEmail: string;
  phone: string;
  website: string;
  proofFile: File | null;
}

const getPasswordStrength = (password: string) => {
  if (password.length === 0) return { strength: 0, label: "" };
  if (password.length < 8) return { strength: 25, label: "Weak" };
  if (password.length < 12) return { strength: 50, label: "Fair" };
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
    return { strength: 50, label: "Fair" };
  return { strength: 100, label: "Strong" };
};

const EmployerRegistration = () => {
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
    logo: null,
    description: "",
    industry: "",
    contactEmail: "",
    phone: "",
    website: "",
    proofFile: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const passwordStrength = getPasswordStrength(formData.password);

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

  useEffect(() => {
    setFormData((prev) => {
      if (!prev.email || prev.contactEmail) {
        return prev;
      }

      return { ...prev, contactEmail: prev.email };
    });
  }, [formData.email]);

  const handleInputChange = (
    field: keyof FormData,
    value: string | File | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFileUpload = (field: "logo" | "proofFile", file: File | null) => {
    if (file) {
      // Validate file type and size
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [field]: "Only JPEG, PNG, and PDF files are allowed",
        }));
        return;
      }

      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          [field]: "File size must be less than 5MB",
        }));
        return;
      }

      handleInputChange(field, file);
      toast.success(`${file.name} uploaded successfully`);
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
        });
      } else if (step === 3) {
        step3Schema.parse({
          phone: formData.phone,
          website: formData.website,
          proofFile: formData.proofFile,
          contactEmail: formData.contactEmail,
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
      const response = await registerEmployer({
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email.trim(),
        password: formData.password,
        companyName: formData.companyName.trim(),
        address: formData.address.trim(),
      });

      const successMessage =
        (response as { message?: string })?.message ||
        "Registration submitted! Awaiting verification.";
      toast.success(successMessage);
      setIsSubmitted(true);
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

  if (isSubmitted) {
    return (
      <div
        className="space-y-6 py-8 text-center animate-fade-in"
        role="status"
        aria-live="polite"
      >
        <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-accent" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-foreground">
            Registration Complete!
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your employer account has been created. You can browse jobs while we
            verify your company information.
          </p>
        </div>
        <div className="bg-muted/50 p-4 sm:p-5 rounded-lg border border-border inline-block">
          <p className="text-sm">
            <strong className="text-foreground">Status:</strong>{" "}
            <span className="text-secondary font-medium">Unverified</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You'll be able to post jobs once verification is complete.
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = "/")}
          className="bg-primary hover:bg-primary/90 h-11 sm:h-12 px-6 touch-manipulation"
        >
          Browse Jobs
        </Button>
      </div>
    );
  }

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
                <Label htmlFor="name" className="text-sm sm:text-base">
                  First Name
                </Label>
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
                <Label htmlFor="surname" className="text-sm sm:text-base">
                  Last Name
                </Label>
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
              <Label htmlFor="email" className="text-sm sm:text-base">
                Work Email
              </Label>
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
              <Label htmlFor="password" className="text-sm sm:text-base">
                Password
              </Label>
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
                  aria-describedby={
                    errors.password
                      ? "password-error"
                      : formData.password
                      ? "password-strength"
                      : undefined
                  }
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
              className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 touch-manipulation"
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
              <Label htmlFor="companyName" className="text-sm sm:text-base">
                Company Name
              </Label>
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
              <Label htmlFor="address" className="text-sm sm:text-base">
                Company Address
              </Label>
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
              <Label htmlFor="logo" className="text-sm sm:text-base">
                Company Logo
              </Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
                role="button"
                tabIndex={formData.logo ? -1 : 0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    document.getElementById("logo-upload")?.click();
                  }
                }}
              >
                {!formData.logo ? (
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload
                      className="w-8 h-8 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-muted-foreground text-center">
                      Click to upload logo (JPEG, PNG • Max 5MB)
                    </span>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload("logo", e.target.files?.[0] || null)
                      }
                      aria-label="Upload company logo"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText
                        className="w-5 h-5 text-primary"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {formData.logo.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(formData.logo.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInputChange("logo", null)}
                      className="min-w-[44px] min-h-[44px]"
                      aria-label="Remove uploaded logo"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </div>
              {errors.logo && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.logo}
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
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
            <p className="text-sm text-muted-foreground">
              Optional: Share contact details and supporting documents to speed
              up verification.
            </p>

            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="text-sm sm:text-base">
                Contact Email
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="contact@company.com"
                value={formData.contactEmail}
                onChange={(e) =>
                  handleInputChange("contactEmail", e.target.value)
                }
                className={`h-11 sm:h-12 ${
                  errors.contactEmail ? "border-destructive" : ""
                }`}
                aria-invalid={!!errors.contactEmail}
                aria-describedby={
                  errors.contactEmail ? "contact-email-error" : undefined
                }
              />
              {errors.contactEmail && (
                <p
                  id="contact-email-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.contactEmail}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm sm:text-base">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+66 12 345 6789"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={`h-11 sm:h-12 ${
                  errors.phone ? "border-destructive" : ""
                }`}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
              {errors.phone && (
                <p
                  id="phone-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm sm:text-base">
                Website (Optional)
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

            <div className="space-y-2">
              <Label htmlFor="proofFile" className="text-sm sm:text-base">
                Proof of Registration (Optional)
              </Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
                role="button"
                tabIndex={formData.proofFile ? -1 : 0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    document.getElementById("proof-upload")?.click();
                  }
                }}
              >
                {!formData.proofFile ? (
                  <label
                    htmlFor="proof-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload
                      className="w-8 h-8 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-muted-foreground text-center">
                      <span className="block">
                        Upload company registration or business license
                      </span>
                      <span className="block mt-1 text-xs">
                        (JPEG, PNG, PDF • Max 5MB)
                      </span>
                    </span>
                    <input
                      id="proof-upload"
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(
                          "proofFile",
                          e.target.files?.[0] || null
                        )
                      }
                      aria-label="Upload proof of registration"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText
                        className="w-5 h-5 text-primary"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {formData.proofFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(formData.proofFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInputChange("proofFile", null)}
                      className="min-w-[44px] min-h-[44px]"
                      aria-label="Remove uploaded proof document"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </div>
              {errors.proofFile && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.proofFile}
                </p>
              )}
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
                disabled={isSubmitting}
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
