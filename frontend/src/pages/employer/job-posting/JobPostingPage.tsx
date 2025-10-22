import EmployerSidebar from '@/components/EmployerSideBar';
import CompanyProfileCard from '@/pages/employer/job-posting/components/CompanyProfileCard';
import JobPostingForm from '@/pages/employer/job-posting/components/JobPostingForm';

const SIDEBAR_W = 280;

export default function JobPostingPage() {
  return (
    <>
      <div className="fixed inset-0 -z-50 pointer-events-none bg-bg-1" />

      <aside className="fixed inset-y-0 left-0 z-20" style={{ width: SIDEBAR_W }}>
        <EmployerSidebar />
      </aside>

      <main className="min-h-screen pl-[280px] p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-8 text-brand-lime">Post a Job</h1>
            <p className="text-muted-foreground">
              Connect with talented KU engineering students ready to join your team
            </p>
          </div>

          <section className="rounded-2xl bg-white p-8">
            <div className="flex flex-col">
              <CompanyProfileCard />
              <JobPostingForm />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
