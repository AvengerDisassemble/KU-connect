import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { phoneSchema } from "./phoneSchema";
import { useNavigate, useLocation } from "react-router-dom";
import { registerAlumni, login, setAuthSession } from "@/services/auth";
import { API_BASE } from "@/services/api";
import { fetchDegreeTypes } from "@/services/degree";
const getRoleDestination = (role?: string) => {
  switch (role) {
    case "student":
    case "alumni":
      return "/student/browse-jobs";
    case "employer":
    case "professor":
      return "/employer/profile";
    default:
      return "/";
  }
};

type OAuthMessagePayload = {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    role?: string;
    name?: string;
  } & Record<string, unknown>;
};

interface OAuthMessageEventData {
  type?: string;
  payload?: OAuthMessagePayload;
}

type DegreeOption = {
  id: string;
  label: string;
};

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 488 512"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path
      d="M488 261.8c0-17.7-1.6-35.1-4.7-52H249v98.7h134.7c-5.8 31.5-23.3 58.2-49.8 76v62h80.2c46.9-43.2 73.9-107 73.9-184.7z"
      fill="#4285f4"
    />
    <path
      d="M249 492c67.5 0 124.2-22.4 165.6-60.5l-80.2-62c-22.4 15-51.1 23.8-85.4 23.8-65.7 0-121.4-44.3-141.3-103.8h-82v65.1C67.6 439.6 152.7 492 249 492z"
      fill="#34a853"
    />
    <path
      d="M107.7 289.5c-5.2-15-8.2-31.1-8.2-47.5s3-32.5 8.2-47.5v-65.1h-82A240.2 240.2 0 0 0 9 242c0 37.6 8.9 73.2 24.7 105.6z"
      fill="#fbbc04"
    />
    <path
      d="M249 97.2c36.7 0 69.3 12.7 95 37.6l71.2-71.2C373.2 24.9 316.5 0 249 0 152.7 0 67.6 52.4 33.7 136.4l82 65.1C127.6 142 183.3 97.2 249 97.2z"
      fill="#ea4335"
    />
  </svg>
);

const alumniSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required" }),
    surname: z.string().min(1, { message: "Surname is required" }),
    email: z.string().email({ message: "Invalid email address" }).max(255),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
    address: z.string().min(1, { message: "Address is required" }),
    degreeTypeId: z.string().min(1, { message: "Select a degree type" }),
    phoneNumber: phoneSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const StudentRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAlumni, setIsAlumni] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    degreeTypeId: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [degreeOptions, setDegreeOptions] = useState<DegreeOption[]>([]);
  const [isLoadingDegrees, setIsLoadingDegrees] = useState(false);
  const [degreeFetchError, setDegreeFetchError] = useState<string | null>(null);

  const apiOrigin = useMemo(() => {
    try {
      return new URL(API_BASE).origin;
    } catch {
      return "http://localhost:3000";
    }
  }, []);

  const apiBase = useMemo(() => API_BASE.replace(/\/$/, ""), []);
  const googleAuthUrl = useMemo(() => `${apiBase}/api/auth/google`, [apiBase]);

  useEffect(() => {
    if (location.search.includes("error=oauth_failed")) {
      setOauthError("Google sign-in failed. Please try again.");
      toast.error("Google sign-in failed. Please try again.");
    }
  }, [location.search]);

  const loadDegreeOptions = useCallback(async () => {
    setIsLoadingDegrees(true);
    setDegreeFetchError(null);

    try {
      const types = await fetchDegreeTypes();
      setDegreeOptions(
        types.map((type) => ({
          id: type.id,
          label: type.name,
        }))
      );
    } catch (err) {
      console.error("Failed to load degree types:", err);
      const message =
        err instanceof Error ? err.message : "Failed to load degree types";
      setDegreeFetchError(message);
    } finally {
      setIsLoadingDegrees(false);
    }
  }, []);

  useEffect(() => {
    loadDegreeOptions();
  }, [loadDegreeOptions]);

  useEffect(() => {
    if (
      formData.degreeTypeId &&
      !degreeOptions.some((option) => option.id === formData.degreeTypeId)
    ) {
      setFormData((prev) => ({ ...prev, degreeTypeId: "" }));
    }
  }, [degreeOptions, formData.degreeTypeId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<OAuthMessageEventData>) => {
      if (event.origin !== apiOrigin) return;
      const { type, payload } = event.data || {};
      if (type !== "oauth" || !payload) return;

      const { accessToken, refreshToken, user } = payload;
      if (!accessToken || !refreshToken || !user) return;

      setAuthSession({
        accessToken,
        refreshToken,
        user,
      });

      setOauthError(null);
      setIsOAuthInProgress(false);
      toast.success(`Welcome ${user?.name ?? "back"}!`);

      const destination = getRoleDestination(user?.role);
      navigate(destination, { replace: true });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [apiOrigin, navigate]);

  const handleOAuthSignup = useCallback(() => {
    setOauthError(null);
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const authUrl = new URL(googleAuthUrl);
    authUrl.searchParams.set("origin", window.location.origin);
    if (location.pathname) {
      authUrl.searchParams.set("redirect", location.pathname);
    }

    const popup = window.open(
      authUrl.toString(),
      "ku-connect-google-oauth",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );

    if (!popup) {
      const message = "Please enable pop-ups to sign in with Google.";
      setOauthError(message);
      toast.error(message);
      return;
    }

    setIsOAuthInProgress(true);
    toast.info(
      "Continue in the Google window to verify your KU Gmail account."
    );
  }, [googleAuthUrl, location.pathname]);

  const validateField = (field: keyof typeof formData, value: string) => {
    try {
      // Validate individual field
      if (field === "email") {
        z.string().email().max(255).parse(value);
      } else if (field === "name") {
        z.string().min(3).max(30).parse(value);
      } else if (field === "surname") {
        z.string().min(3).max(30).parse(value);
      } else if (field === "password") {
        z.string().min(8).parse(value);
      } else if (field === "phoneNumber") {
        phoneSchema.parse(value);
      }
      setErrors((prev) => ({ ...prev, [field]: "" }));
    } catch (err) {
      if (
        err instanceof z.ZodError &&
        Array.isArray(err.issues) &&
        err.issues.length > 0
      ) {
        setErrors((prev) => ({ ...prev, [field]: err.issues[0].message }));
      }
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleAlumniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = alumniSchema.parse(formData);

      await toast.promise(
        (async () => {
          console.log("Submitting alumni register:", validatedData);
          // Step 1: Register
          await registerAlumni({
            name: validatedData.name,
            surname: validatedData.surname,
            email: validatedData.email,
            password: validatedData.password,
            address: validatedData.address,
            degreeTypeId: validatedData.degreeTypeId,
            phoneNumber: validatedData.phoneNumber,
          });

          // Step 2: Login
          const loginData = await login(
            validatedData.email,
            validatedData.password
          );
          const { user } = loginData.data;

          navigate("/student/upload-transcript");
          return user.name;
        })(),
        {
          loading: "Registering account...",
          success: (name) => `Welcome ${name}!`,
          error: (err) => err.message || "Something went wrong",
        }
      );
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        if (Array.isArray(err.issues)) {
          err.issues.forEach((error) => {
            if (error.path && error.path.length > 0) {
              fieldErrors[error.path[0] as string] = error.message;
            }
          });
        }
        setErrors(fieldErrors);
        toast.error("Please fix the errors in the form");
      } else {
        console.error("Non-Zod error:", err);
        let message = "Unknown error";
        let backendErrors: string[] | undefined = undefined;

        if (typeof err === "object" && err !== null) {
          if (
            "message" in err &&
            typeof (err as { message?: unknown }).message === "string"
          ) {
            message = (err as { message: string }).message;
          }
          if (
            "errors" in err &&
            Array.isArray((err as { errors?: unknown }).errors)
          ) {
            backendErrors = (err as { errors: string[] }).errors;
          }
        }

        if (Array.isArray(backendErrors)) {
          toast.error(`${message}: ${backendErrors.join(", ")}`);
        } else {
          toast.error(message);
        }
      }
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "" };
    if (password.length < 8) return { strength: 25, label: "Weak" };
    if (password.length < 12) return { strength: 50, label: "Fair" };
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return { strength: 50, label: "Fair" };
    return { strength: 100, label: "Strong" };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAlumni && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [isAlumni]);

  if (!isAlumni) {
    return (
      <div className="space-y-8 rounded-3xl bg-white/60 p-6 shadow-sm">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-slate-900">
            Current students
          </h3>
          <p className="text-sm text-slate-500">
            Use your KU Gmail account for instant access. Alumni can continue
            below for manual verification.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleOAuthSignup}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-3 text-base font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            aria-label="Sign up with Kasetsart University Gmail account"
            disabled={isOAuthInProgress}
          >
            <GoogleIcon />
            Sign up with KU Gmail
          </Button>
          {oauthError && (
            <p className="text-sm text-destructive" role="alert">
              {oauthError}
            </p>
          )}

          <div className="relative text-center text-xs uppercase tracking-[0.3em] text-slate-300">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <span className="relative bg-white/80 px-2 text-slate-400">or</span>
          </div>

          <Button
            onClick={() => setIsAlumni(true)}
            variant="outline"
            className="w-full rounded-2xl border border-primary/40 py-3 text-base font-medium text-primary hover:bg-primary/5"
            aria-label="Register as alumni with email"
          >
            Register as alumni
          </Button>
        </div>

      </div>
    );
  }

  return (
    <form
      onSubmit={handleAlumniSubmit}
      className="space-y-6 animate-slide-in-right"
      role="form"
      aria-label="Alumni registration form"
    >
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {Object.keys(errors).length > 0 &&
          "Form has errors. Please review and correct."}
      </div>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="space-y-2 flex-1">
            <Label htmlFor="name" className="text-sm sm:text-base">
              First Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your first name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`h-11 sm:h-12 ${
                errors.name ? "border-destructive" : ""
              }`}
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2 flex-1">
            <Label htmlFor="surname" className="text-sm sm:text-base">
              Last Name
            </Label>
            <Input
              id="surname"
              type="text"
              placeholder="Enter your last name"
              value={formData.surname}
              onChange={(e) => handleInputChange("surname", e.target.value)}
              className={`h-11 sm:h-12 ${
                errors.surname ? "border-destructive" : ""
              }`}
              required
            />
            {errors.surname && (
              <p className="text-sm text-destructive">{errors.surname}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm sm:text-base">
            Email Address
          </Label>
          <Input
            ref={emailInputRef}
            id="email"
            type="email"
            placeholder="your.email@example.com"
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
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`h-11 sm:h-12 ${
                errors.password ? "border-destructive pr-10" : "pr-10"
              }`}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "password-error" : "password-strength"
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
                <span className="font-medium">{passwordStrength.label}</span>
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
              errors.confirmPassword
                ? "confirm-password-error"
                : formData.confirmPassword &&
                  formData.password === formData.confirmPassword
                ? "password-match"
                : undefined
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber" className="text-sm sm:text-base">
          Phone Number
        </Label>
        <Input
          id="phoneNumber"
          type="tel"
          placeholder="e.g. +66912345678"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
          className={`h-11 sm:h-12 ${
            errors.phoneNumber ? "border-destructive" : ""
          }`}
          aria-invalid={!!errors.phoneNumber}
          aria-describedby={
            errors.phoneNumber ? "phoneNumber-error" : undefined
          }
          required
        />
        {errors.phoneNumber && (
          <p
            id="phoneNumber-error"
            className="text-sm text-destructive"
            role="alert"
          >
            {errors.phoneNumber}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-sm sm:text-base">
          Address
        </Label>
        <Input
          id="address"
          type="text"
          placeholder="Enter your address"
          value={formData.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          className={`h-11 sm:h-12 ${
            errors.address ? "border-destructive" : ""
          }`}
          required
        />
        {errors.address && (
          <p className="text-sm text-destructive">{errors.address}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="degreeTypeId" className="text-sm sm:text-base">
          Degree Type
        </Label>
        <Select
          value={formData.degreeTypeId}
          onValueChange={(val) => handleInputChange("degreeTypeId", val)}
        >
          <SelectTrigger
            disabled={isLoadingDegrees || degreeOptions.length === 0}
            className={`h-11 sm:h-12 ${
              errors.degreeTypeId ? "border-destructive" : ""
            }`}
          >
            <SelectValue
              placeholder={
                isLoadingDegrees
                  ? "Loading degree types..."
                  : "Select your degree type"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {degreeOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.degreeTypeId && (
          <p className="text-sm text-destructive">{errors.degreeTypeId}</p>
        )}
        {degreeFetchError && (
          <div className="text-sm text-destructive flex items-center gap-2">
            <span>{degreeFetchError}</span>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={loadDegreeOptions}
            >
              Retry
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsAlumni(false)}
          className="flex-1 rounded-xl border border-slate-200 py-3 text-slate-700 hover:bg-slate-50"
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 rounded-xl bg-primary py-3 text-primary-foreground hover:bg-primary/90"
        >
          Create account
        </Button>
      </div>
    </form>
  );
};

export default StudentRegistration;
