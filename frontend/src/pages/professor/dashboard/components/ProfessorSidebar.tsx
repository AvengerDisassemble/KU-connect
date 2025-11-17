import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import Logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logout } from "@/services/auth";

interface ProfessorSidebarProps {
  onNavigate?: () => void;
}

const navItems = [
  { label: "Student Analytics Dashboard", to: "/professor" },
  { label: "Student Analytics Insights", to: "/professor/analytics" },
];

const ProfessorSidebar: React.FC<ProfessorSidebarProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await logout();
      navigate("/login");
      onNavigate?.();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsSigningOut(false);
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
          for professors
        </div>
      </div>

      <nav className="flex-1 space-y-2 py-5 text-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/professor"}
            onClick={() => {
              onNavigate?.();
            }}
            className={({ isActive }) =>
              cn(
                "block border-l-[3px] px-8 py-4 font-medium transition-colors max-[390px]:px-6 max-[390px]:py-3",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border-l-transparent text-muted-foreground hover:bg-muted/60",
              )
            }
            style={({ isActive }) => ({
              borderLeftColor: isActive ? "var(--color-accent)" : "transparent",
            })}
          >
            {item.label}
          </NavLink>
        ))}

      </nav>

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
};

export default ProfessorSidebar;
