import { type MouseEventHandler } from "react";

import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export interface Job {
  id: string;
  title: string;
  applicants: number;
  shortlisted: number;
  postedDate: string;
  location: string;
  status: "open" | "closed";
}

interface JobCardProps {
  job: Job;
  onViewApplicants?: (jobId: string) => void;
  onEditJob?: (jobId: string) => void;
  variant?: "card" | "list";
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  onViewApplicants,
  onEditJob,
  variant = "card",
}: JobCardProps) => {
  const badgeVariant: NonNullable<BadgeProps["variant"]> = job.status;

  const handleViewApplicants: MouseEventHandler<HTMLButtonElement> = () => {
    onViewApplicants?.(job.id);
  };

  const handleEditJob: MouseEventHandler<HTMLButtonElement> = () => {
    onEditJob?.(job.id);
  };

  const Inner = (
    <>
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-xl font-semibold text-foreground">
          {job.title}
        </h3>
        <Badge
          variant={badgeVariant}
          className="rounded-full px-3 py-1 uppercase"
        >
          {job.status}
        </Badge>
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">
            {job.applicants}
          </span>{" "}
          applicants
        </span>
        <span>•</span>
        <span>
          <span className="font-semibold text-foreground">
            {job.shortlisted}
          </span>{" "}
          shortlisted
        </span>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        Posted {job.postedDate} • {job.location}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleViewApplicants}
          size="sm"
          className="bg-primary text-white shadow-md hover:bg-primary/90"
        >
          View Applicants
        </Button>
        <Button
          onClick={handleEditJob}
          variant="outline"
          size="sm"
          className="text-primary hover:text-primary hover:bg-gray-200"
        >
          Edit Job
        </Button>
      </div>
    </>
  );

  if (variant === "list") {
    return (
      <div className="px-6 py-6">
        {Inner}
      </div>
    );
  }

  return (
    <Card className="p-6">
      {Inner}
    </Card>
  );
};

export default JobCard;
