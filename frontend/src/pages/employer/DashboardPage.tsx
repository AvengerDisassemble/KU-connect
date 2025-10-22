import EmployerSidebar from "@/components/EmployerSideBar";
import EmployerDashboardContent from "./dashboard/components/DashboardContent";

export default function EmployerDashboardPage() {
  return (
    <>
      <div className="fixed inset-0 -z-50 pointer-events-none bg-bg-1" />

      <aside className="fixed inset-y-0 left-0 z-20 w-[280px]">
        <EmployerSidebar />
      </aside>

      <main className="min-h-screen pl-[280px] p-6">
        <EmployerDashboardContent />
      </main>
    </>
  );
}
