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
    <aside className="w-60 bg-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-8 pt-8 border-b border-gray-200 text-center">
        <div className="flex items-center justify-center">
          <img
            src={Logo}
            alt="KU Connect Logo"
            className="block h-12 w-auto max-w-[260px] object-contain select-none ml-12"
            draggable={false}
          />
        </div>
        <div className="text-sm text-brand-lime font-medium">
          for employer
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 space-y-2 text-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block px-8 py-4 font-medium transition-colors border-l-3 ${
                isActive
                  ? "bg-teal-700 text-white border-l-brand-lime"
                  : "text-gray-600 hover:bg-gray-50 border-l-transparent"
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
          className="w-full justify-center"
          onClick={handleLogout}
          disabled={isSigningOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </aside>
  );
}
