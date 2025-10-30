import { motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Job } from "../types";
import {
  formatSalary,
  formatDeadline,
  formatRelativeTime,
  getJobTypeColor,
} from "../utils/helpers";

interface JobCardProps {
  job: Job;
  isSelected: boolean;
  isSaved: boolean;
  onSelectJob: (jobId: string) => void;
  onToggleSave: (jobId: string) => void;
  index: number;
  isSorting: boolean;
}

const JobCard = ({
  job,
  isSelected,
  isSaved,
  onSelectJob,
  onToggleSave,
  index,
  isSorting,
}: JobCardProps) => {
  const handleCardClick = () => onSelectJob(job.id);

  const handleSaveClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleSave(job.id);
  };

  const transition = isSorting
    ? {
        layout: { type: "spring", stiffness: 320, damping: 32 },
        duration: 0.15,
      }
    : {
        duration: 0.18,
        delay: index * 0.025,
      };

  return (
    <motion.div
      key={job.id}
      initial={isSorting ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={transition}
      layout
    >
      <Card
        onClick={handleCardClick}
        className={cn(
          "group cursor-pointer border border-transparent bg-card/90 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md",
          isSelected &&
            "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/30"
        )}
      >
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h3 className="text-base font-semibold leading-tight text-foreground line-clamp-2">
                    {job.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {job.companyName || "Unnamed company"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-muted-foreground transition-colors hover:text-primary",
                    isSaved && "text-primary"
                  )}
                  onClick={handleSaveClick}
                  aria-label={isSaved ? "Remove job from saved" : "Save job"}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location || "Location not specified"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(job.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:flex-col md:items-start md:gap-y-1.5">
            <span className="flex items-center gap-1.5 font-medium text-primary md:w-full">
              <DollarSign className="h-4 w-4" />
              {formatSalary(job.minSalary, job.maxSalary)}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground md:w-full">
              <Calendar className="h-4 w-4" />
              Apply by {formatDeadline(job.application_deadline)}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className={cn("text-xs capitalize", getJobTypeColor(job.jobType))}
            >
              {(job.jobType ?? "Unknown type").replace(/-/g, " ")}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs capitalize border-border bg-muted/60 text-muted-foreground"
            >
              {job.workArrangement ?? "unspecified"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default JobCard;
