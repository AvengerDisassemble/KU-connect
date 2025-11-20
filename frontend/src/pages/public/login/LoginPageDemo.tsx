import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchCurrentUser,
  login,
  logout,
  setAuthSession,
  type AuthSessionPayload,
} from "@/services/auth";
import { API_BASE } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, LineChart } from "lucide-react";

const getRoleDestination = (role?: string, userId?: string) => {
  switch (role) {
    case "STUDENT":
    case "ALUMNI":
      return "/student";
    case "EMPLOYER":
      return userId ? `/employer/profile/${userId}` : "/employer";
    case "PROFESSOR":
      return "/professor";
    case "ADMIN":
      return "/admin";
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
    id?: string;
  } & Record<string, unknown>;
};

interface OAuthMessageEventData {
  type?: string;
  payload?: OAuthMessagePayload;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      if (!user) return;

      const sessionPayload: AuthSessionPayload = { user };
      if (typeof accessToken === "string" && accessToken.length > 0) {
        sessionPayload.accessToken = accessToken;
      }
      if (typeof refreshToken === "string" && refreshToken.length > 0) {
        sessionPayload.refreshToken = refreshToken;
      }

      setAuthSession(sessionPayload);

      if (!sessionPayload.accessToken || !sessionPayload.refreshToken) {
        void fetchCurrentUser()
          .then((current) => {
            if (current) {
              setAuthSession({ user: current });
            }
          })
          .catch((error) => {
            console.warn("Failed to hydrate session after OAuth", error);
          });
      }
      setOauthError(null);

      toast.success(
        `Welcome back, ${user?.name ?? ""}`.trim() || "Signed in successfully"
      );
      const destination = getRoleDestination(user?.role, user?.id);
      navigate(destination, { replace: true });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [apiOrigin, navigate]);

  const handleGoogleLogin = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setOauthError(null);
      void logout();

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
      const destination = getRoleDestination(user.role, user.id);
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
    <div className="min-h-screen bg-[#f6f5f0] text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl gap-12 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-center space-y-12">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
              KU CONNECT
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 lg:text-5xl">
              A calmer space for recruiting, mentoring, and alumni support.
            </h1>
            <p className="text-lg text-slate-500">
              KU Connect keeps every KU workflow calm and focused—bringing shared dashboards, updates,
              and hiring tools together in one minimalist workspace.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: LineChart, label: "Real-time analytics" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 shadow-sm"
              >
                <feature.icon className="mb-3 h-4 w-4 text-slate-400" />
                <p>{feature.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg">
          <div className="mb-8 space-y-1">
            <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in with your KU Gmail or alumni email.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-slate-600" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@ku.th"
              />
              {errors.email ? (
                <p className="text-sm text-rose-500">{errors.email}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-600" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 mr-3 flex items-center text-slate-400 transition hover:text-slate-600"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? (
                <p className="text-sm text-rose-500">{errors.password}</p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-slate-300">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full gap-3 rounded-xl border border-primary/40 bg-white text-primary hover:bg-primary/5"
          >
            <GoogleIcon />
            Continue with Google
          </Button>
          {oauthError ? (
            <p className="mt-2 text-sm text-rose-500">{oauthError}</p>
          ) : null}

          <div className="mt-auto text-sm text-slate-500">
            Need an account?{" "}
            <a className="font-medium text-slate-900 underline-offset-4 hover:underline" href="/register">
              Request access
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
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
