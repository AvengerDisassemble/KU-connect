import { NotificationBell } from "@/components/notifications";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface FloatingNotificationButtonProps {
  className?: string;
}

const FloatingNotificationButton = ({
  className,
}: FloatingNotificationButtonProps) => {
  const { user, isAuthenticated } = useAuth();
  const role = (user?.role ?? "").toLowerCase();

  if (!isAuthenticated || !user?.id || role === "student") {
    return null;
  }

  return (
    <div
      className={cn("fixed bottom-6 right-6 z-50 drop-shadow-lg", className)}
    >
      <NotificationBell
        userId={user.id}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
      />
    </div>
  );
};

export default FloatingNotificationButton;
