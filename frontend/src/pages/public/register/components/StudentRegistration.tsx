import { useState, useEffect, useRef } from "react";
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
import { Mail, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { registerAlumni, login } from "@/services/auth";

const DEGREE_OPTIONS = [
    { id: 1, label: "Bachelor" },
    { id: 2, label: "Master" },
    { id: 3, label: "PhD" },
  ];

const alumniSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    surname: z.string().min(1, { message: "Surname is required" }),
    email: z.string().email({ message: "Invalid email address" }).max(255),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
    address: z.string().min(1, { message: "Address is required" }),
    degreeTypeId: z.coerce.number().int().positive({ message: "Select a degree type" }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const StudentRegistration = () => {
    const navigate = useNavigate();
  const [isAlumni, setIsAlumni] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    degreeTypeId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOAuthSignup = () => {
    toast.info("Redirecting to KU Gmail authentication...");
    // OAuth redirect would happen here
    setTimeout(() => {
      toast.success("OAuth integration ready!");
    }, 1000);
  };

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
      }
      setErrors(prev => ({ ...prev, [field]: "" }));
    } catch (err) {
    if (
        err instanceof z.ZodError &&
        Array.isArray(err.errors) &&
        err.errors.length > 0
        ) {
        setErrors(prev => ({ ...prev, [field]: err.errors[0].message }));
      }
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleAlumniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = alumniSchema.parse(formData);

      await toast.promise(
        (async () => {
          // Step 1: Register
          await registerAlumni({
            name: validatedData.name,
            surname: validatedData.surname,
            email: validatedData.email,
            password: validatedData.password,
            address: validatedData.address,
            degreeTypeId: validatedData.degreeTypeId,
          });

          // Step 2: Login
          const loginData = await login(validatedData.email, validatedData.password);
          const { user, accessToken, refreshToken } = loginData.data;

          // Step 3: Store session
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("user", JSON.stringify(user));

          navigate("/student/browsejobs");
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
        if (Array.isArray(err.errors)) {
          err.errors.forEach((error) => {
            if (error.path && error.path.length > 0) {
              fieldErrors[error.path[0] as string] = error.message;
            }
          });
        }
        setErrors(fieldErrors);
        toast.error("Please fix the errors in the form");
    } else {
        console.error("Non-Zod error:", err);
        const message = (err as any)?.message || "Unknown error";
        const backendErrors = (err as any)?.errors;
      
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
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return { strength: 50, label: "Fair" };
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
      <div className="space-y-6 animate-fade-in" role="region" aria-label="Student registration options">
        <div className="space-y-4">
          <Button 
            onClick={handleOAuthSignup}
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-medium bg-primary hover:bg-primary/90 transition-all touch-manipulation"
            size="lg"
            aria-label="Sign up with Kasetsart University Gmail account"
          >
            <Mail className="w-5 h-5 mr-2" aria-hidden="true" />
            Sign up with KU Gmail
          </Button>

          <div className="relative" role="separator" aria-label="Alternative registration method">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            onClick={() => setIsAlumni(true)}
            variant="outline"
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-medium border-border hover:bg-muted transition-all touch-manipulation"
            size="lg"
            aria-label="Register as alumni with email"
          >
            Register as Alumni
          </Button>
        </div>

        <div className="bg-muted/50 p-4 sm:p-5 rounded-lg border border-border" role="note">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Current students:</strong> Use your KU Gmail account for instant verification.
            <br />
            <strong className="text-foreground">Alumni:</strong> Register with your personal email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleAlumniSubmit} className="space-y-6 animate-slide-in-right" role="form" aria-label="Alumni registration form">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {Object.keys(errors).length > 0 && "Form has errors. Please review and correct."}
      </div>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="space-y-2 flex-1">
            <Label htmlFor="name" className="text-sm sm:text-base">First Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your first name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`h-11 sm:h-12 ${errors.name ? "border-destructive" : ""}`}
              required
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2 flex-1">
            <Label htmlFor="surname" className="text-sm sm:text-base">Last Name</Label>
            <Input
              id="surname"
              type="text"
              placeholder="Enter your last name"
              value={formData.surname}
              onChange={(e) => handleInputChange("surname", e.target.value)}
              className={`h-11 sm:h-12 ${errors.surname ? "border-destructive" : ""}`}
              required
            />
            {errors.surname && <p className="text-sm text-destructive">{errors.surname}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm sm:text-base">Email Address</Label>
          <Input
            ref={emailInputRef}
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className={`h-11 sm:h-12 ${errors.email ? "border-destructive" : ""}`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            required
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`h-11 sm:h-12 ${errors.password ? "border-destructive pr-10" : "pr-10"}`}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : "password-strength"}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
          {formData.password && (
            <div className="space-y-1" id="password-strength">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={passwordStrength.strength} aria-valuemin={0} aria-valuemax={100}>
                <div 
                  className={`h-full transition-all duration-300 ${
                    passwordStrength.strength === 100 ? "bg-accent" : 
                    passwordStrength.strength >= 50 ? "bg-secondary" : "bg-destructive"
                  }`}
                  style={{ width: `${passwordStrength.strength}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength: <span className="font-medium">{passwordStrength.label}</span>
              </p>
            </div>
          )}
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            className={`h-11 sm:h-12 ${errors.confirmPassword ? "border-destructive" : ""}`}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : formData.confirmPassword && formData.password === formData.confirmPassword ? "password-match" : undefined}
            required
          />
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <p id="password-match" className="text-sm text-accent flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Passwords match
            </p>
          )}
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2">
  <Label htmlFor="address" className="text-sm sm:text-base">Address</Label>
  <Input
    id="address"
    type="text"
    placeholder="Enter your address"
    value={formData.address}
    onChange={(e) => handleInputChange("address", e.target.value)}
    className={`h-11 sm:h-12 ${errors.address ? "border-destructive" : ""}`}
    required
  />
  {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
</div>

<div className="space-y-2">
  <Label htmlFor="degreeTypeId" className="text-sm sm:text-base">Degree Type</Label>
    <Select
    value={formData.degreeTypeId?.toString() || ""}
    onValueChange={(val) => handleInputChange("degreeTypeId", Number(val))}
    >
    <SelectTrigger
        className={`h-11 sm:h-12 ${errors.degreeTypeId ? "border-destructive" : ""}`}
    >
        <SelectValue placeholder="Select your degree type" />
    </SelectTrigger>
    <SelectContent>
        {DEGREE_OPTIONS.map((option) => (
        <SelectItem key={option.id} value={option.id.toString()}>
            {option.label}
        </SelectItem>
        ))}
    </SelectContent>
    </Select>
  {errors.degreeTypeId && (
    <p className="text-sm text-destructive">{errors.degreeTypeId}</p>
  )}
</div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsAlumni(false)}
          className="flex-1 h-11 sm:h-12 touch-manipulation"
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 h-11 sm:h-12 bg-primary hover:bg-primary/90 touch-manipulation"
        >
          Create Account
        </Button>
      </div>
    </form>
  );
};

export default StudentRegistration;
