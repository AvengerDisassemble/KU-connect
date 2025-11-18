"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useSidebar } from "@/components/ui/sidebar";

export function SidebarMobileOverlay() {
  const { open, setOpen, pinned } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const handleMediaChange = () => {
      setIsDesktop(mediaQuery.matches);
    };

    handleMediaChange();
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const shouldShowOverlay = useMemo(
    () => open && !pinned && !isDesktop,
    [open, pinned, isDesktop]
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    if (shouldShowOverlay) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [shouldShowOverlay]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClose();
      }
    },
    [handleClose]
  );

  return (
    <AnimatePresence>
      {shouldShowOverlay ? (
        <motion.div
          key="sidebar-mobile-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          role="button"
          aria-label="Dismiss sidebar"
          aria-modal="true"
          tabIndex={0}
          onClick={handleClose}
          onKeyDown={handleKeyDown}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm focus:outline-none transition-opacity duration-300 md:hidden"
        />
      ) : null}
    </AnimatePresence>
  );
}
