import { useEffect, type RefObject } from "react";

export const useAppHeaderHeight = (ref: RefObject<HTMLElement | null>) => {
  const element = ref.current;

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    const root = document.documentElement;

    const applyHeight = (height: number) => {
      root.style.setProperty("--app-header-height", `${height}px`);
    };

    if (!element) {
      applyHeight(0);
      return undefined;
    }

    const updateHeight = () => {
      applyHeight(element.offsetHeight ?? 0);
    };

    updateHeight();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateHeight())
        : null;

    if (resizeObserver) {
      resizeObserver.observe(element);
    }

    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      applyHeight(0);
    };
  }, [element]);
};
