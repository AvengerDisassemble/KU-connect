import { Edit, HelpCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileSidebarProps {
  activeTab: "profile" | "job-preferences";
  onTabChange: (tab: "profile" | "job-preferences") => void;
}

const ProfileSidebar = ({ activeTab, onTabChange }: ProfileSidebarProps) => {
  return (
    <aside className="w-72 bg-card border-r border-border p-6">
      {/* Profile Avatar and Info */}
      <div className="text-center mb-8">
        <div className="relative inline-block mb-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-muted-foreground/30 rounded-full"></div>
          </div>
          {/* Verification badge */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Edit className="w-3 h-3 text-primary-foreground" />
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground font-medium mb-1">SKE</div>
        <div className="font-semibold text-foreground">Phantawat Organ</div>
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-2 mb-8">
        <button
          onClick={() => onTabChange("profile")}
          className={cn(
            "w-full text-left px-4 py-3 rounded-md font-medium transition-colors",
            activeTab === "profile" 
              ? "bg-primary/10 text-primary border-r-2 border-primary" 
              : "text-foreground hover:bg-muted"
          )}
        >
          Profile
        </button>
        <button
          onClick={() => onTabChange("job-preferences")}
          className={cn(
            "w-full text-left px-4 py-3 rounded-md font-medium transition-colors",
            activeTab === "job-preferences" 
              ? "bg-primary/10 text-primary border-r-2 border-primary" 
              : "text-foreground hover:bg-muted"
          )}
        >
          Job preferences
        </button>
      </nav>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <HelpCircle className="w-4 h-4 mr-2" />
          Help Center
        </Button>
        
        <Button variant="outline" className="w-full">
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  );
};

export default ProfileSidebar;