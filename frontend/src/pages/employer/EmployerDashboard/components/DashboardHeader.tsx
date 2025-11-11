import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onPostJob?: () => void;
}

const DashboardHeader = ({
  onPostJob,
}: DashboardHeaderProps) => {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="mb-2 text-3xl font-bold">
          Employer Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Manage your job postings and candidates.
        </p>
      </div>
      <Button
        onClick={onPostJob}
        size="lg"
        className="bg-primary hover:bg-primary/90"
      >
        Post New Job
      </Button>
    </div>
  );
};

export default DashboardHeader;
