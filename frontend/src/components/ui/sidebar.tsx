import { cn } from "@/lib/utils";
import { NavLink, type NavLinkProps } from "react-router-dom";
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  cloneElement,
  isValidElement,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

export interface SidebarLinkItem {
  label: string;
  to: string;
  icon: React.JSX.Element | React.ReactNode;
  end?: boolean;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
  pinned: boolean;
  setPinned: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);
// eslint-disable-next-line react-refresh/only-export-components
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

const STORAGE_PREFIX = "ku-connect:sidebar";

type StoredSidebarState = {
  open?: boolean;
  pinned?: boolean;
};

const readStoredState = (storageKey?: string): StoredSidebarState => {
  if (!storageKey || typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(
      `${STORAGE_PREFIX}:${storageKey}`
    );
    return raw ? (JSON.parse(raw) as StoredSidebarState) : {};
  } catch {
    return {};
  }
};

const persistState = (
  storageKey: string | undefined,
  state: StoredSidebarState
) => {
  if (!storageKey || typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      `${STORAGE_PREFIX}:${storageKey}`,
      JSON.stringify(state)
    );
  } catch {
    // Swallow storage errors quietly; persistence is best-effort
  }
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
  pinned: pinnedProp,
  setPinned: setPinnedProp,
  defaultOpen = false,
  defaultPinned = false,
  storageKey,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  pinned?: boolean;
  setPinned?: React.Dispatch<React.SetStateAction<boolean>>;
  defaultOpen?: boolean;
  defaultPinned?: boolean;
  storageKey?: string;
}) => {
  const storedState = readStoredState(storageKey);
  const [openState, setOpenState] = useState<boolean>(
    storedState.open ?? defaultOpen
  );
  const [pinnedState, setPinnedState] = useState<boolean>(
    storedState.pinned ?? defaultPinned
  );

  const isControlledOpen = openProp !== undefined && setOpenProp !== undefined;
  const isControlledPinned =
    pinnedProp !== undefined && setPinnedProp !== undefined;

  const open = isControlledOpen ? openProp : openState;
  const setOpen = isControlledOpen ? setOpenProp : setOpenState;
  const pinned = isControlledPinned ? pinnedProp : pinnedState;
  const setPinned = isControlledPinned ? setPinnedProp : setPinnedState;

  useEffect(() => {
    if (isControlledOpen || isControlledPinned) {
      return;
    }

    persistState(storageKey, { open, pinned });
  }, [open, pinned, storageKey, isControlledOpen, isControlledPinned]);

  return (
    <SidebarContext.Provider
      value={{ open, setOpen, animate, pinned, setPinned }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
  pinned,
  setPinned,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  pinned?: boolean;
  setPinned?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <SidebarProvider
      open={open}
      setOpen={setOpen}
      animate={animate}
      pinned={pinned}
      setPinned={setPinned}
    >
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate, pinned } = useSidebar();
  const handleMouseEnter = () => {
    if (!pinned) {
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!pinned) {
      setOpen(false);
    }
  };
  return (
    <motion.div
      className={cn(
        "relative hidden h-screen w-[300px] flex-shrink-0 flex-col bg-neutral-100 px-4 py-4 dark:bg-neutral-800 md:flex md:z-50",
        className
      )}
      animate={{
        width: animate ? (open ? "300px" : "60px") : "300px",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-0 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-neutral-800 dark:text-neutral-200 cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed inset-y-0 left-0 z-[50] flex h-full w-[85%] max-w-xs flex-col justify-between bg-card p-6 shadow-2xl",
                className
              )}
            >
              <div
                className="absolute right-4 top-4 z-50 cursor-pointer text-foreground transition hover:text-foreground/80"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: SidebarLinkItem;
  className?: string;
  props?: NavLinkProps;
}) => {
  const { open, animate } = useSidebar();
  const renderIcon = (isActive: boolean) => {
    const baseClass = cn(
      "h-5 w-5",
      isActive ? "text-primary" : "text-muted-foreground"
    );

    if (isValidElement(link.icon)) {
      const element = link.icon as React.ReactElement<{ className?: string }>;
      return cloneElement(element, {
        className: cn(baseClass, element.props.className),
      });
    }

    return link.icon;
  };

  return (
    <NavLink
      to={link.to}
      end={link.end}
      className={({ isActive }) =>
        cn(
          "group/sidebar flex items-center rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isActive
            ? "bg-primary/10 text-primary shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          open ? "px-3 py-2 gap-3 justify-start" : "px-2 py-2 justify-center",
          className
        )
      }
      {...props}
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground group-hover/sidebar:text-foreground"
            )}
          >
            {renderIcon(isActive)}
          </span>
          <motion.span
            animate={{
              display: animate
                ? open
                  ? "inline-flex"
                  : "none"
                : "inline-flex",
              opacity: animate ? (open ? 1 : 0) : 1,
            }}
            className="whitespace-pre text-sm transition duration-150 group-hover/sidebar:translate-x-1"
          >
            {link.label}
          </motion.span>
        </>
      )}
    </NavLink>
  );
};
