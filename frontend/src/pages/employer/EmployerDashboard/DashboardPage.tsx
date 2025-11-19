import EmployerLayout from "@/components/layout/EmployerLayout";
import EmployerDashboardContent from "./components/DashboardContent";

export default function EmployerDashboardPage() {
  return (
    <EmployerLayout title="Employer Dashboard">
      <EmployerDashboardContent />
    </EmployerLayout>
  );
}
