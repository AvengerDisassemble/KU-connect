"use client";

import type { PropsWithChildren } from "react";

import { SidebarProvider as PrimitiveSidebarProvider } from "./sidebar";

interface SidebarProviderProps extends PropsWithChildren {
  storageKey?: string;
  defaultOpen?: boolean;
  defaultPinned?: boolean;
}

export function SidebarProvider({
  children,
  storageKey,
  defaultOpen,
  defaultPinned,
}: SidebarProviderProps) {
  return (
    <PrimitiveSidebarProvider
      storageKey={storageKey}
      defaultOpen={defaultOpen}
      defaultPinned={defaultPinned}
    >
      {children}
    </PrimitiveSidebarProvider>
  );
}
