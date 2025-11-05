"use client";

import { useCallback, useState, type ReactNode } from "react";

import { Menu, X } from "lucide-react";

import EmployerSidebar from "@/components/EmployerSideBar";
import { cn } from "@/lib/utils";

interface EmployerPageShellProps {
  title?: string;
  children: ReactNode;
  backgroundClassName?: string;
  contentClassName?: string;
}

const EmployerPageShell: React.FC<EmployerPageShellProps> = ({
  title,
  children,
  backgroundClassName,
  contentClassName,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const MOBILE_BAR_HEIGHT = "h-16";

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const openMobile = useCallback(() => {
    setMobileOpen(true);
  }, []);

  return (
    <div className="relative flex min-h-screen">
      <div
        className={cn(
          "pointer-events-none fixed inset-0 -z-50 bg-bg-1",
          backgroundClassName
        )}
      />

      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:block md:w-[280px]">
        <EmployerSidebar />
      </aside>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={closeMobile}
          />
          <div
            id="employer-mobile-sidebar"
            className="relative z-50 flex h-full w-[85%] max-w-[280px] flex-col bg-card shadow-lg max-[390px]:max-w-[240px]"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-muted-foreground">
                Navigation
              </span>
              <button
                type="button"
                onClick={closeMobile}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <EmployerSidebar onNavigate={closeMobile} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col md:pl-[280px]">
        <div
          className={cn(
            "fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 shadow-sm backdrop-blur-sm md:hidden",
            MOBILE_BAR_HEIGHT
          )}
        >
          <button
            type="button"
            onClick={openMobile}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-card/80"
            aria-expanded={mobileOpen}
            aria-controls="employer-mobile-sidebar"
          >
            <Menu className="h-4 w-4" />
            <span>Menu</span>
          </button>
          {title ? (
            <span className="text-sm font-semibold text-foreground line-clamp-1">
              {title}
            </span>
          ) : null}
        </div>

        <div className={cn("md:hidden", MOBILE_BAR_HEIGHT)} aria-hidden="true" />

        <main className={cn("flex-1 p-4 sm:p-6", contentClassName)}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default EmployerPageShell;
