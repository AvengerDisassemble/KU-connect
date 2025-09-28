import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import Logo from "@/assets/logo.png";

const Header = () => {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left: Logo */}
      <Link to="/" className="flex items-center gap-2">
        <img src={Logo} alt="KU Connect Logo" className="h-12 w-auto" />
      </Link>

      {/* Center: Navigation */}
      <nav className="hidden md:flex items-center gap-6">
        <Link to="/student" className="text-foreground hover:text-primary text-sm font-medium">Home</Link>
        <Link to="/student/browsejobs" className="text-foreground hover:text-primary text-sm font-medium">Browse Jobs</Link>
        <Link to="/student/profile" className="text-foreground hover:text-primary text-sm font-medium">Profile</Link>
      </nav>

      {/* Right: Search, Notifications, User, Mobile Menu */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search" 
            className="pl-10 w-64 bg-muted border-0"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
        </Button>

        {/* User Profile */}
        <div className="flex items-center gap-2">
        <Avatar className="bg-primary w-9 h-9 rounded-full">
          <AvatarFallback className="text-primary text-sm font-medium">
            TU
          </AvatarFallback>
        </Avatar>
          <span className="hidden md:block font-medium">Test User</span>
        </div>

        {/* Mobile menu */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;