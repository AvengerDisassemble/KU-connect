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

const secondaryNavItems = [
  { label: "Analytics Dashboard" },
  { label: "Settings" },
] as const;

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
      <div className="border-b border-border p-8 pt-9 text-left max-[390px]:p-6">
        <div className="flex items-center gap-3">
          <img
            src={Logo}
            alt="KU Connect Logo"
            className="h-12 w-auto select-none object-contain"
            draggable={false}
          />
        </div>
      </div>

      <nav className="flex-1 space-y-2 py-5 text-sm">
        <NavLink
          to="/professor"
          end
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
          Student Analytics
        </NavLink>

        {secondaryNavItems.map((item) => (
          <div
            key={item.label}
            className="px-8 py-4 text-sm font-semibold text-muted-foreground/70 max-[390px]:px-6 max-[390px]:py-3"
          >
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 px-4 py-2 text-muted-foreground/80">
              {item.label}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (coming soon)
              </span>
            </div>
          </div>
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
