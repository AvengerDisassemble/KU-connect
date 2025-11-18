import { Fragment, type ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Logo from "@/assets/logo.png";
import LogoSidebar from "@/assets/logo_sidebar.png";
import { cn } from "@/lib/utils";
import {
  DesktopSidebar,
  MobileSidebar,
  SidebarLink,
  type SidebarLinkItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/auth";
import { LogOut, Loader2 } from "lucide-react";

import type { AppSidebarItem } from "./sidebar-config";
import { getSidebarConfig } from "./sidebar-config";

type SidebarSlot = ReactNode | ((open: boolean) => ReactNode);

interface AppSidebarProps {
  role?: string | null;
  userId?: string;
  roleLabel?: ReactNode;
  headerSlot?: SidebarSlot;
  footerSlot?: SidebarSlot;
  className?: string;
  headerClassName?: string;
  footerClassName?: string;
  navClassName?: string;
  showLogo?: boolean;
  collapseButtonHidden?: boolean;
}

interface AppSidebarContentProps
  extends Omit<AppSidebarProps, "role" | "userId"> {
  items: AppSidebarItem[];
}

const defaultHeader = (
  showLogo: boolean,
  roleLabel: ReactNode | undefined,
  open: boolean
) => {
  if (!showLogo && !roleLabel) {
    return null;
  }

  return (
    <div className={cn("space-y-3", open ? undefined : "space-y-0")}>
      {showLogo ? (
        <div className="flex items-center justify-center overflow-visible">
          <img
            src={open ? Logo : LogoSidebar}
            alt={open ? "KU Connect" : "KU Connect mark"}
            className={cn(
              "select-none object-contain transition-all",
              open
                ? "h-10 w-auto max-w-full opacity-100"
                : "h-16 w-auto max-w-none opacity-100"
            )}
            draggable={false}
          />
        </div>
      ) : null}
      {roleLabel && open ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          {roleLabel}
        </p>
      ) : null}
    </div>
  );
};

const renderSlot = (slot: SidebarSlot | undefined, open: boolean) => {
  if (!slot) {
    return null;
  }

  if (typeof slot === "function") {
    return <Fragment>{slot(open)}</Fragment>;
  }

  return <Fragment>{slot}</Fragment>;
};

interface SidebarSignOutProps {
  open: boolean;
}

const SidebarSignOut = ({ open }: SidebarSignOutProps) => {
  const navigate = useNavigate();
  const { setOpen } = useSidebar();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    try {
      setIsSigningOut(true);
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsSigningOut(false);
      setOpen(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => void handleSignOut()}
      disabled={isSigningOut}
      className={cn(
        "w-full rounded-lg px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive",
        open ? "justify-start gap-2" : "justify-center gap-0 px-0"
      )}
    >
      {isSigningOut ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {open ? (
        <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
      ) : null}
    </Button>
  );
};

const AppSidebarContent = ({
  items,
  roleLabel,
  headerSlot,
  footerSlot,
  className,
  headerClassName,
  footerClassName,
  navClassName,
  showLogo = true,
}: AppSidebarContentProps) => {
  const { open } = useSidebar();

  const sidebarItems: SidebarLinkItem[] = useMemo(
    () =>
      items.map((item) => ({
        label: item.label,
        to: item.to,
        end: item.end,
        icon: <item.icon className="h-4 w-4" />,
      })),
    [items]
  );

  const headerContent = headerSlot
    ? renderSlot(headerSlot, open)
    : defaultHeader(showLogo, roleLabel, open);
  const footerSlotContent = footerSlot ? renderSlot(footerSlot, open) : null;

  const sharedNav = (
    <nav
      className={cn(
        "flex h-full flex-col gap-1 overflow-y-auto pr-1",
        navClassName
      )}
    >
      {sidebarItems.map((link) => (
        <SidebarLink key={link.to ?? link.label} link={link} />
      ))}
    </nav>
  );

  return (
    <>
      <DesktopSidebar
        className={cn(
          "fixed top-0 left-0 z-40 hidden h-screen border-r border-border bg-card py-6 shadow-sm md:flex",
          open
            ? "w-[300px] px-4 [clip-path:path('M_0_0_L_300_0_Q_300_80_260_80_L_260_100vh_L_0_100vh_Z')]"
            : "w-[80px] px-3 [clip-path:none]",
          className
        )}
      >
        <div className="relative flex h-full flex-col gap-6">
          {headerContent ? (
            <div
              className={cn(
                "text-center transition-[opacity,transform]",
                open
                  ? "space-y-3 opacity-100"
                  : "flex h-28 items-center justify-center opacity-100",
                headerClassName
              )}
            >
              {headerContent}
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto pt-2">{sharedNav}</div>

          <div className={cn("border-t border-border pt-4", footerClassName)}>
            <div
              className={cn(
                "flex flex-col gap-3",
                open ? undefined : "items-center"
              )}
            >
              {footerSlotContent ? (
                <div
                  className={cn(
                    "w-full transition-opacity",
                    open ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                >
                  {footerSlotContent}
                </div>
              ) : null}
              <SidebarSignOut open={open} />
            </div>
          </div>
        </div>
      </DesktopSidebar>

      <MobileSidebar className="bg-card">
        <div className="flex h-full flex-col gap-6">
          {headerContent ? (
            <div className="space-y-3 text-center">{headerContent}</div>
          ) : null}
          <div className="flex-1 overflow-y-auto pt-2">{sharedNav}</div>
          <div className="border-t border-border pt-4">
            <div className="flex flex-col gap-3">
              {footerSlotContent}
              <SidebarSignOut open={open} />
            </div>
          </div>
        </div>
      </MobileSidebar>
    </>
  );
};

const toTitleCase = (value?: string | null) => {
  if (!value) {
    return undefined;
  }
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export function AppSidebar({
  role,
  userId,
  roleLabel,
  ...rest
}: AppSidebarProps) {
  const items = useMemo(
    () => getSidebarConfig(role, { userId }),
    [role, userId]
  );

  if (!items.length) {
    return null;
  }

  return (
    <AppSidebarContent
      items={items}
      roleLabel={roleLabel ?? toTitleCase(role)}
      {...rest}
    />
  );
}

export default AppSidebar;
