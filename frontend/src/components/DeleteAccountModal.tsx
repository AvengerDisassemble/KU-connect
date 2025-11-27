import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteAccount } from "@/services/user";
import { clearAuthSession } from "@/services/auth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteAccountModalProps {
  userId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountModal = ({
  userId,
  open,
  onOpenChange,
}: DeleteAccountModalProps) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (isDeleting) return;
      onOpenChange(next);
    },
    [isDeleting, onOpenChange]
  );

  const handleDelete = useCallback(async () => {
    if (!userId) {
      toast.error("Unable to delete account. Missing user identifier.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount(userId);
      clearAuthSession();
      toast.success("Your account has been deleted.");
      handleOpenChange(false);
      navigate("/", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete your account. Please try again.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }, [handleOpenChange, navigate, userId]);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete account</AlertDialogTitle>
          <AlertDialogDescription>
            Deleting your KU Connect account will remove your profile, uploaded
            resumes, and any associated applications. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <p className="leading-relaxed">
            Please confirm that you want to permanently erase your account and
            personal data from the platform.
          </p>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Confirm Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
