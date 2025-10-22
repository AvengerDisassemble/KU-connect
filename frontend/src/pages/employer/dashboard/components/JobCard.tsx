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

const JobCard = ({ job, onViewApplicants, onEditJob, variant = "card" }: JobCardProps) => {
  const badgeVariant: NonNullable<BadgeProps["variant"]> = job.status;

  const Inner = (
    <>
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
        <Badge variant={badgeVariant} className="uppercase rounded-full px-3 py-1">
          {job.status}
        </Badge>
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{job.applicants}</span> applicants
        </span>
        <span>•</span>
        <span>
          <span className="font-semibold text-foreground">{job.shortlisted}</span> shortlisted
        </span>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        Posted {job.postedDate} • {job.location}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => onViewApplicants?.(job.id)}
          size="sm"
          className="bg-brand-teal text-white hover:bg-brand-teal/90 shadow-md"
        >
          View Applicants
        </Button>
        <Button
          onClick={() => onEditJob?.(job.id)}
          variant="outline"
          size="sm"
          className="text-brand-teal hover:bg-brand-teal hover:text-white"
        >
          Edit Job
        </Button>
      </div>
    </>
  );

  if (variant === "list") {
    return <div className="px-6 py-6">{Inner}</div>;
  }

  return <Card className="p-6">{Inner}</Card>;
};

export default JobCard;
