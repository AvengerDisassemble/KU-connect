import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login, setAuthSession } from "@/services/auth";
import { API_BASE } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

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
      const message = "Google sign-in failed. Please try again.";
      setOauthError(message);
      toast.error(message);
    }
  }, [location.search]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<OAuthMessageEventData>) => {
      if (event.origin !== apiOrigin) return;
      const { type, payload } = event.data || {};
      if (type !== "oauth" || !payload) return;

      const { accessToken, refreshToken, user } = payload;
      if (!accessToken || !refreshToken || !user) return;

      setAuthSession({ accessToken, refreshToken, user });
      setIsPopupOpen(false);
      setOauthError(null);

      toast.success(
        `Welcome back, ${user?.name ?? ""}`.trim() || "Signed in successfully"
      );
      const destination = getRoleDestination(user?.role);
      navigate(destination, { replace: true });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [apiOrigin, navigate]);

  const handleGoogleLogin = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setOauthError(null);

      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authUrl = new URL(googleAuthUrl);
      authUrl.searchParams.set("origin", window.location.origin);
      if (location.pathname) {
        authUrl.searchParams.set("redirect", location.pathname);
      }

      const popup = window.open(
        authUrl.toString(),
        "ku-connect-google-login",
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
      );

      if (!popup) {
        const message = "Please allow pop-ups to continue with Google sign-in.";
        setOauthError(message);
        toast.error(message);
        return;
      }

      setIsPopupOpen(true);
    },
    [googleAuthUrl, location.pathname]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    if (!email || !password) {
      setErrors({
        email: !email ? "Email is required" : undefined,
        password: !password ? "Password is required" : undefined,
      });
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await login(email, password);
      const { user } = response.data;

      toast.success(`Welcome back, ${user.name}!`);
      const destination = getRoleDestination(user.role);
      navigate(destination, { replace: true });
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 mt-12 p-6 bg-card border rounded-lg animate-fade-in">
      <h1 className="text-xl font-semibold text-center">Login to KU-Connect</h1>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={isPopupOpen || isSubmitting}
        className="w-full h-12 flex items-center justify-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          aria-hidden="true"
          className="w-5 h-5"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.15 0 5.3 1.37 6.52 2.52l4.76-4.68C32.73 4.21 28.73 2 24 2 14.82 2 7.29 7.82 4.38 15.94l5.98 4.64C12.5 13.88 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.5 24.5c0-1.64-.15-3.21-.43-4.74H24v9h12.7c-.55 2.95-2.2 5.45-4.67 7.13l7.12 5.53C43.79 37.32 46.5 31.53 46.5 24.5z"
          />
          <path
            fill="#FBBC05"
            d="M10.36 28.57A14.5 14.5 0 0 1 9.5 24c0-1.58.27-3.11.75-4.57l-5.98-4.64A21.92 21.92 0 0 0 2 24c0 3.53.84 6.88 2.32 9.87l6.04-5.3z"
          />
          <path
            fill="#34A853"
            d="M24 46c5.73 0 10.53-1.89 14.04-5.14l-7.12-5.53c-1.94 1.3-4.43 2.07-6.92 2.07-6.26 0-11.5-4.38-13.64-10.13l-6.04 5.3C7.29 40.18 14.82 46 24 46z"
          />
        </svg>
        Continue with Google
      </Button>
      {oauthError && <p className="text-sm text-destructive">{oauthError}</p>}

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-2 text-xs uppercase text-muted-foreground">
            Or use your email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={errors.email ? "border-destructive" : ""}
            autoComplete="email"
            required
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={errors.password ? "border-destructive pr-10" : "pr-10"}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-primary hover:bg-primary/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Login"}
        </Button>
      </form>
    </div>
  );
};

export default LoginPage;

interface OAuthMessagePayload {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    role?: string;
    name?: string;
  } & Record<string, unknown>;
}

interface OAuthMessageEventData {
  type?: string;
  payload?: OAuthMessagePayload;
}

function getRoleDestination(role?: string) {
  const normalizedRole =
    typeof role === "string" ? role.toUpperCase() : undefined;
  switch (normalizedRole) {
    case "STUDENT":
      return "/student/dashboard";
    case "EMPLOYER":
      return "/employer";
    case "ADMIN":
      return "/admin";
    case "PROFESSOR":
      return "/professor";
    default:
      return "/";
  }
}
