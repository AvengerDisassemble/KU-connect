import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ConsentCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  className?: string;
}

export const ConsentCheckbox = ({
  id,
  checked,
  onChange,
  required,
  className,
}: ConsentCheckboxProps) => {
  return (
    <div className={cn("flex items-start gap-3 text-sm", className)}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        aria-required={required}
        className="mt-1"
      />
      <Label htmlFor={id} className="text-muted-foreground leading-relaxed">
        I consent to the processing of my personal data according to the{" "}
        <Link
          to="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </Label>
    </div>
  );
};
