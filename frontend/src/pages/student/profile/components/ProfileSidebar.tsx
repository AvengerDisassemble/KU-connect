import { Edit, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/services/profile";
import { useNavigate } from "react-router-dom";
import { logout } from "@/services/auth";
import AvatarUpload from "@/components/AvatarUpload";

interface ProfileSidebarProps {
  activeTab: "profile" | "job-preferences";
  onTabChange: (tab: "profile" | "job-preferences") => void;
  userId?: string;
}

const ProfileSidebar = ({
  activeTab,
  onTabChange,
  userId,
}: ProfileSidebarProps) => {
  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId, // Only run query if userId is available
  });

  const fullName = profile ? `${profile.name} ${profile.surname}` : "";
  const degreeAbbrev = profile?.student?.degreeType?.name ?? "";
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  return (
    <aside className="w-72 bg-card rounded-2xl border-r border-border p-6">
      {/* Profile Avatar and Info */}
      <div className="text-center mb-8">
        {userId ? (
          <AvatarUpload
            userId={userId}
            name={profile?.name}
            surname={profile?.surname}
            size="lg"
            className="mb-4"
            buttonClassName="bg-primary text-primary-foreground hover:bg-primary/90"
            helperText="JPG, PNG or WebP up to 5MB"
          />
        ) : (
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-muted-foreground/30 rounded-full"></div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Edit className="w-3 h-3 text-primary-foreground" />
            </div>
          </div>
        )}
        {!userId ? (
          <p className="text-xs text-muted-foreground mb-4">
            JPG, PNG or WebP up to 5MB
          </p>
        ) : null}

        <div className="text-xs text-muted-foreground font-medium mb-1">
          {degreeAbbrev}
        </div>
        <div className="font-semibold text-foreground">{fullName || " "}</div>
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
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  );
};

export default ProfileSidebar;
