import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logout } from "@/services/auth";
import { useState } from "react";

export default function EmployerSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const navItems = [
    {
      label: "Dashboard",
      to: "/employer",
      end: true,
    },
    {
      label: "Post New Job",
      to: "/employer/job-postings/create",
      end: true,
    },
    {
      label: "Company Profile",
      to: `/employer/profile/${user!.id}`,
      end: true,
    },
    {
      label: "Preview Job Listings",
      to: "/employer/job-postings",
      end: true,
    },
  ] as const;

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <aside className="flex min-h-screen w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="border-border border-b p-8 pt-8 text-center">
        <div className="flex items-center justify-center">
          <img
            src={Logo}
            alt="KU Connect Logo"
            className="ml-12 block h-12 w-auto max-w-[260px] select-none object-contain"
            draggable={false}
          />
        </div>
        <div className="text-sm font-medium text-accent">
          for employer
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-2 py-5 text-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block border-l-[3px] px-8 py-4 font-medium transition-colors ${
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

      {/* Sign out */}
      <div className="px-6 pb-6">
        <Button
          variant="outline"
          className="w-full justify-center border-border"
          onClick={handleLogout}
          disabled={isSigningOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </aside>
  );
}
