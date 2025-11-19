import { useMemo } from "react";
import {
  ArrowRight,
  Briefcase,
  ClipboardList,
  UploadCloud,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QuickActionLabel =
  | "Browse Jobs"
  | "Update Profile"
  | "Upload Resume"
  | "View Applications";

interface QuickActionGridProps {
  quickActions?: string[];
  browseJobsPath?: string;
  profilePath?: string;
  resumePath?: string;
  applicationsPath?: string;
}

interface QuickActionConfig {
  label: QuickActionLabel;
  description: string;
  to: string;
  icon: LucideIcon;
}

const QuickActionGrid = ({
  quickActions,
  browseJobsPath = "/student/browse-jobs",
  profilePath = "/student/profile",
  resumePath = "/student/profile#resume",
  applicationsPath = "/student#applications",
}: QuickActionGridProps) => {
  const quickActionMap = useMemo<Record<QuickActionLabel, QuickActionConfig>>(
    () => ({
      "Browse Jobs": {
        label: "Browse Jobs",
        description: "Discover internships and roles that match you",
        to: browseJobsPath,
        icon: Briefcase,
      },
      "Update Profile": {
        label: "Update Profile",
        description: "Keep your student profile fresh",
        to: profilePath,
        icon: UserRound,
      },
      "Upload Resume": {
        label: "Upload Resume",
        description: "Share your latest resume with employers",
        to: resumePath,
        icon: UploadCloud,
      },
      "View Applications": {
        label: "View Applications",
        description: "Check application statuses in one place",
        to: applicationsPath,
        icon: ClipboardList,
      },
    }),
    [applicationsPath, browseJobsPath, profilePath, resumePath]
  );

  const actions = useMemo(() => {
    const availableLabels = quickActions?.length
      ? Array.from(
          new Set(
            quickActions.filter((label): label is QuickActionLabel =>
              Object.prototype.hasOwnProperty.call(quickActionMap, label)
            )
          )
        )
      : (Object.keys(quickActionMap) as QuickActionLabel[]);

    if (!availableLabels.length) {
      return Object.values(quickActionMap);
    }

    return availableLabels.map((label) => quickActionMap[label]);
  }, [quickActions, quickActionMap]);

  return (
    <Card className="border-border/80 bg-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">
          Quick actions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          A few shortcuts to keep your search moving
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className="group rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm transition hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-foreground">
                      {action.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionGrid;
