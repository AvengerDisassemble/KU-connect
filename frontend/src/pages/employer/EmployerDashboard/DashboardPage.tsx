import { useNavigate } from "react-router-dom";

import EmployerLayout from "@/components/layout/EmployerLayout";
import EmployerDashboardContent from "./components/DashboardContent";
import { Button } from "@/components/ui/button";

export default function EmployerDashboardPage() {
  const navigate = useNavigate();

  const headerActions = (
    <Button
      size="lg"
      onClick={() => navigate("/employer/job-postings/create")}
      className="bg-primary text-white hover:bg-primary/90"
    >
      Post New Job
    </Button>
  );

  return (
    <EmployerLayout
      title="Employer Dashboard"
      description="Welcome back! Manage your job postings and candidates."
      actions={headerActions}
    >
      <EmployerDashboardContent />
    </EmployerLayout>
  );
}
