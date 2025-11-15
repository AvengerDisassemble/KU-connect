import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { LogOut } from "lucide-react";

import Logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/auth";

interface EmployerSidebarProps {
  onNavigate?: () => void;
}

export default function EmployerSidebar({ onNavigate }: EmployerSidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const companyProfilePath = useMemo(() => {
    if (user?.id) {
      return `/employer/profile/${user.id}`;
    }

    return "/employer/profile";
  }, [user?.id]);

  const navItems = useMemo(
    () => [
      { label: "Dashboard", to: "/employer", end: true },
      { label: "Post New Job", to: "/employer/job-postings/create", end: true },
      { label: "Browse Jobs", to: "/employer/browse-jobs", end: true },
      { label: "Company Profile", to: companyProfilePath, end: true },
    ],
    [companyProfilePath]
  );

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsSigningOut(false);
      onNavigate?.();
    }
  };

  return (
    <aside className="flex min-h-screen w-full max-w-[280px] flex-col border-r border-border bg-card max-[390px]:max-w-[240px] md:w-60">
      <div className="border-border border-b p-8 pt-8 text-center max-[390px]:p-6">
        <div className="flex items-center justify-center">
          <img
            src={Logo}
            alt="KU Connect Logo"
            className="ml-12 block h-12 w-auto max-w-[260px] select-none object-contain max-[390px]:ml-0"
            draggable={false}
          />
        </div>
        <div className="text-sm font-medium text-accent max-[390px]:text-xs">
          for employer
        </div>
      </div>

      <nav className="flex-1 space-y-2 py-5 text-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => {
              onNavigate?.();
            }}
            className={({ isActive }) =>
              `block border-l-[3px] px-8 py-4 font-medium transition-colors max-[390px]:px-6 max-[390px]:py-3 ${
                isActive
                  ? "border-l-accent bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-border border-t p-8 max-[390px]:p-6">
        <Button
          variant="outline"
          className="flex w-full items-center justify-center gap-2"
          onClick={handleLogout}
          disabled={isSigningOut}
        >
          <LogOut className="h-4 w-4" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </aside>
  );
}
