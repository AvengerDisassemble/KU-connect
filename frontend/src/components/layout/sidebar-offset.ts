import { useSidebar } from "@/components/ui/sidebar";

export const APP_SIDEBAR_WIDTH = 300;
export const APP_SIDEBAR_COLLAPSED_WIDTH = 60;
export const APP_SIDEBAR_OPEN_OFFSET_CLASS = "md:pl-[300px]";
export const APP_SIDEBAR_COLLAPSED_OFFSET_CLASS = "md:pl-[60px]";

export function useSidebarOffsetClass() {
  const { open } = useSidebar();
  return open
    ? APP_SIDEBAR_OPEN_OFFSET_CLASS
    : APP_SIDEBAR_COLLAPSED_OFFSET_CLASS;
}
