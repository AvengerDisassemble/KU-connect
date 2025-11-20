import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Menu, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/auth";
import { useAvatar } from "@/hooks/useAvatar";
import { getInitials } from "@/utils/getInitials";
import Logo from "@/assets/logo.png";
import { NotificationBell } from "@/components/notifications";
import { useAppHeaderHeight } from "@/hooks/useAppHeaderHeight";

const Header = () => {
  const { user, isAuthenticated } = useAuth();
  const isStudent = user?.role === "student";
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const {
    avatarUrl,
    isLoading: isAvatarLoading,
    isFetching: isAvatarFetching,
  } = useAvatar(user?.id);
  const headerRef = useRef<HTMLElement | null>(null);

  useAppHeaderHeight(headerRef);

  useEffect(() => {
    if (!isStudent) {
      setSearchTerm("");
      return;
    }

    if (location.pathname.startsWith("/student/browse-jobs")) {
      const params = new URLSearchParams(location.search);
      setSearchTerm(params.get("search") ?? "");
    }
  }, [isStudent, location.pathname, location.search]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isAvatarBusy = isAvatarLoading || isAvatarFetching;

  if (isAuthenticated && !isStudent) {
    return null;
  }

  const [shouldShow, setShouldShow] = useState(true);
  const lastScroll = useRef(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const current = window.scrollY || 0;
        const delta = current - lastScroll.current;
        if (current <= 32) {
          setShouldShow(true);
        } else if (delta < -4) {
          setShouldShow(true);
        } else if (delta > 4) {
          setShouldShow(false);
        }
        lastScroll.current = current;
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerClasses = useMemo(
    () =>
      [
        "sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur transition-transform duration-200 supports-[backdrop-filter]:bg-card/70",
        shouldShow ? "translate-y-0" : "-translate-y-full",
      ].join(" "),
    [shouldShow]
  );

  return (
    <header ref={headerRef} data-app-header="true" className={headerClasses}>
      {/* Left: Logo */}
      <Link to="/student" className="flex items-center gap-2">
        <img src={Logo} alt="KU Connect Logo" className="h-12 w-auto" />
      </Link>

      {/* Center: Navigation */}
      {isStudent && (
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/student"
            className="text-foreground hover:text-primary text-sm font-medium"
          >
            Home
          </Link>
          <Link
            to="/student/browse-jobs"
            className="text-foreground hover:text-primary text-sm font-medium"
          >
            Browse Jobs
          </Link>
          <Link
            to={user?.id ? `/student/profile/${user.id}` : "/student/profile"}
            className="text-foreground hover:text-primary text-sm font-medium"
          >
            Profile
          </Link>
        </nav>
      )}

      {/* Right: Search, Notifications, User, Mobile Menu */}
      <div className="flex items-center gap-4">
        {/* Search */}
        {isStudent && (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const query = searchTerm.trim();
                  const params = new URLSearchParams();
                  if (query) {
                    params.set("search", query);
                  }
                  navigate({
                    pathname: "/student/browse-jobs",
                    search: params.toString() ? `?${params.toString()}` : "",
                  });
                }
              }}
              className="pl-10 w-64 bg-muted border-0"
            />
          </div>
        )}

        {/* Notifications */}
        {isStudent && <NotificationBell userId={user?.id} />}

        {/* User Profile */}
        {isAuthenticated && isStudent && user ? (
          <div className="flex items-center gap-2">
            <Avatar className="bg-primary w-9 h-9 rounded-full">
              {avatarUrl ? (
                <AvatarImage
                  src={avatarUrl}
                  alt="Profile avatar"
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="text-primary text-sm font-medium">
                {isAvatarBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  getInitials(user.name, user.surname)
                )}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        )}

        {/* Mobile menu */}
        {isStudent && (
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
