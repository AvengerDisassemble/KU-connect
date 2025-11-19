"use client";

import { type ReactNode, useCallback, useRef } from "react";

import AppSidebar from "@/components/layout/AppSidebar";
import { SidebarMobileOverlay } from "@/components/layout/sidebar-overlay";
import { useSidebarOffsetClass } from "@/components/layout/sidebar-offset";
import { SidebarProvider } from "@/components/ui/sidebar-provider";
import { cn } from "@/lib/utils";
import { useAppHeaderHeight } from "@/hooks/useAppHeaderHeight";

interface ProfessorLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

interface ProfessorLayoutContentProps extends ProfessorLayoutProps {
  sidebarFooter?: (open: boolean) => ReactNode;
}

function ProfessorLayoutContent({
  title,
  description,
  actions,
  children,
  sidebarFooter,
}: ProfessorLayoutContentProps) {
  const sidebarOffsetClass = useSidebarOffsetClass();
  const headerRef = useRef<HTMLElement | null>(null);

  useAppHeaderHeight(headerRef);

  return (
    <div className="relative bg-slate-50 rounded-tr-[48px]">
      <AppSidebar
        role="professor"
        roleLabel="Professor"
        footerSlot={sidebarFooter}
        headerClassName="px-4"
        navClassName="px-2"
        footerClassName="px-4"
      />

      <SidebarMobileOverlay />

      <main
        className={cn(
          "w-full bg-background transition-[padding-left] duration-300 ease-in-out",
          sidebarOffsetClass
        )}
      >
        <header
          ref={headerRef}
          data-app-header="true"
          className="border-b border-border px-4 py-4 sm:px-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                {title}
              </h1>
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </header>

        <section className="relative flex flex-col gap-6 px-4 py-6 sm:px-6">
          {children}
        </section>
      </main>
    </div>
  );
}

export const ProfessorLayout: React.FC<ProfessorLayoutProps> = ({
  title,
  description,
  actions,
  children,
}) => {
  const sidebarFooter = useCallback(
    (open: boolean) => (
      <div
        className={cn(
          "text-xs text-muted-foreground transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
      >
        Mentorship matters © {new Date().getFullYear()}
      </div>
    ),
    []
  );

  return (
    <SidebarProvider storageKey="professor" defaultOpen>
      <ProfessorLayoutContent
        title={title}
        description={description}
        actions={actions}
        sidebarFooter={sidebarFooter}
      >
        {children}
      </ProfessorLayoutContent>
    </SidebarProvider>
  );
};

export default ProfessorLayout;
