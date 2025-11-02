import { useRef, type ChangeEvent } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAvatar } from "@/hooks/useAvatar";
import { AVATAR_ACCEPTED_TYPES, validateAvatarFile } from "@/services/avatar";
import { getInitials } from "@/utils/getInitials";

const sizeMap: Record<"md" | "lg" | "xl", string> = {
  md: "h-16 w-16",
  lg: "h-20 w-20",
  xl: "h-24 w-24",
};

export interface AvatarUploadProps {
  userId?: string;
  name?: string | null;
  surname?: string | null;
  size?: "md" | "lg" | "xl";
  className?: string;
  avatarClassName?: string;
  buttonClassName?: string;
  helperText?: string;
}

const AvatarUpload = ({
  userId,
  name,
  surname,
  size = "lg",
  className,
  avatarClassName,
  buttonClassName,
  helperText,
}: AvatarUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { avatarUrl, isLoading, isUploading, uploadAvatar } = useAvatar(userId);

  const openFilePicker = () => {
    if (!userId) {
      toast.error("Missing user information. Please try again later.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      toast.error(validation.error ?? "Invalid file selected.");
      return;
    }

    try {
      await uploadAvatar(file);
      toast.success("Avatar updated successfully.");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to upload avatar.";
      toast.error(message);
    }
  };

  const isBusy = isLoading || isUploading;

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <div className="relative">
        <Avatar
          className={cn(
            "border border-border bg-muted",
            sizeMap[size],
            avatarClassName
          )}
        >
          {avatarUrl ? (
            <AvatarImage
              src={avatarUrl}
              alt="Profile avatar"
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="text-sm font-medium">
            {isBusy ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              getInitials(name, surname)
            )}
          </AvatarFallback>
        </Avatar>

        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={openFilePicker}
          disabled={isUploading || !userId}
          className={cn(
            "absolute -bottom-1 -right-1 h-8 w-8 rounded-full",
            buttonClassName
          )}
          aria-label="Upload avatar"
          title="Upload avatar"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      </div>

      {helperText ? (
        <p className="mt-2 text-xs text-muted-foreground text-center">
          {helperText}
        </p>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept={AVATAR_ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default AvatarUpload;
