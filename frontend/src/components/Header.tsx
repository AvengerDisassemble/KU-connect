import { Search, Bell, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/auth";
import Logo from "@/assets/logo.png";

const Header = () => {
  const { user, isAuthenticated } = useAuth();
  const isStudent = user?.role === "student";
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Generate initials from user name
  const getInitials = (name?: string, surname?: string) => {
    if (name && surname) {
      return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
    }

    if (name) {
      return name.charAt(0).toUpperCase();
    }

    return "U";
  };

  if (isAuthenticated && !isStudent) {
    return null;
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left: Logo */}
      <Link to="/" className="flex items-center gap-2">
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
            to="/student/browsejobs"
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
              className="pl-10 w-64 bg-muted border-0"
            />
          </div>
        )}

        {/* Notifications */}
        {isStudent && (
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
          </Button>
        )}

        {/* User Profile */}
        {isAuthenticated && isStudent && user ? (
          <div className="flex items-center gap-2">
            <Avatar className="bg-primary w-9 h-9 rounded-full">
              <AvatarFallback className="text-primary text-sm font-medium">
                {getInitials(user.name, user.surname)}
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
