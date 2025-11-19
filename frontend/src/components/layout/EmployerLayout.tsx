"use client";

import { type ReactNode, useRef } from "react";

import AppSidebar from "@/components/layout/AppSidebar";
import { useSidebarOffsetClass } from "@/components/layout/sidebar-offset";
import { SidebarMobileOverlay } from "@/components/layout/sidebar-overlay";
import { SidebarProvider } from "@/components/ui/sidebar-provider";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAppHeaderHeight } from "@/hooks/useAppHeaderHeight";

interface EmployerLayoutProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  backgroundClassName?: string;
  mainClassName?: string;
  contentClassName?: string;
}

interface EmployerLayoutContentProps extends EmployerLayoutProps {
  userId?: string;
}

function EmployerLayoutContent({
  title,
  description,
  actions,
  children,
  backgroundClassName,
  mainClassName,
  contentClassName,
  userId,
}: EmployerLayoutContentProps) {
  const sidebarOffsetClass = useSidebarOffsetClass();
  const headerRef = useRef<HTMLElement | null>(null);

  useAppHeaderHeight(headerRef);

  return (
    <div
      className={cn(
        "relative bg-background rounded-tr-[48px]",
        backgroundClassName
      )}
    >
      <AppSidebar role="employer" userId={userId} roleLabel="Employer" />

      <SidebarMobileOverlay />

      <main
        className={cn(
          "w-full bg-background transition-[padding-left] duration-300 ease-in-out",
          sidebarOffsetClass,
          mainClassName
        )}
      >
        {(title || actions || description) && (
          <header
            ref={headerRef}
            data-app-header="true"
            className="border-b border-border px-4 py-4 sm:px-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                {title ? (
                  <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                    {title}
                  </h1>
                ) : null}
                {description ? (
                  <p className="text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>
          </header>
        )}

        <section className={cn("relative px-4 py-6 sm:px-6", contentClassName)}>
          {children}
        </section>
      </main>
    </div>
  );
}

export default function EmployerLayout({
  title,
  description,
  actions,
  children,
  backgroundClassName,
  mainClassName,
  contentClassName,
}: EmployerLayoutProps) {
  const { user } = useAuth();

  return (
    <SidebarProvider storageKey="employer" defaultOpen>
      <EmployerLayoutContent
        title={title}
        description={description}
        actions={actions}
        children={children}
        backgroundClassName={backgroundClassName}
        mainClassName={mainClassName}
        contentClassName={contentClassName}
        userId={user?.id}
      />
    </SidebarProvider>
  );
}
