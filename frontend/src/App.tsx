import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import { Guard } from "@/components/Guard";
import LandingPage from "@/pages/public/LandingPage";
import LoginPage from "@/pages/public/login/LoginPage";
import RegisterPage from "@/pages/public/register/RegisterPage";
import NotFoundPage from "@/pages/public/NotFoundPage";
import StudentDashboardPage from "@/pages/student/dashboard/DashboardPage";
import StudentProfilePage from "@/pages/student/profile/ProfilePage";
import BrowseJobsPage from "@/pages/student/browse-jobs/BrowseJobsPage";
import EmployerPageShell from "@/components/EmployerPageShell";
// import { AdminLayout } from "@/components/admin/AdminLayout";
import EmployerDashboardPage from "@/pages/employer/EmployerDashboard/DashboardPage";
import EmployerProfilePage from "@/pages/employer/profile/ProfilePage";
import AdminDashboardPage from "@/pages/admin/AdminDashboard/DashboardPage";
import ProfessorDashboardPage from "@/pages/professor/ProfessorDashboard/DashboardPage";
import JobPostingPage from "@/pages/employer/JobPosting/JobPostingPage";
import JobEditPage from "@/pages/employer/JobPosting/JobEditPage";

const EmployerBrowseJobsRoute: React.FC = () => (
  <EmployerPageShell title="Browse Jobs">
    <BrowseJobsPage />
  </EmployerPageShell>
);

// const AdminBrowseJobsRoute: React.FC = () => (
//   <AdminLayout
//     title="Browse Jobs"
//     description="Review job listings available on the platform."
//   >
//     <BrowseJobsPage />
//   </AdminLayout>
// );

const App: React.FC = () => {
  return (
    <div className="min-h-dvh">
      <Header />
      <main className="container mx-auto max-w-screen-xl px-4 py-6">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />}></Route>
          <Route
            path="/student"
            element={
              <Guard role="student">
                <StudentDashboardPage />
              </Guard>
            }
          />
          <Route
            path="/student/profile/:userId"
            element={
              <Guard role="student">
                <StudentProfilePage />
              </Guard>
            }
          />
          <Route
            path="/student/browse-jobs"
            element={
              <Guard role="student">
                <BrowseJobsPage />
              </Guard>
            }
          />
          <Route
            path="/employer/browse-jobs"
            element={
              <Guard role="employer">
                <EmployerBrowseJobsRoute />
              </Guard>
            }
          />
          <Route
            path="/professor/browse-jobs"
            element={
              <Guard role="professor">
                <BrowseJobsPage />
              </Guard>
            }
          />
          {/* <Route
            path="/admin/browse-jobs"
            element={
              <Guard role="admin">
                <AdminBrowseJobsRoute />
              </Guard>
            }
          /> */}
          <Route
            path="/employer"
            element={
              <Guard role="employer">
                <EmployerDashboardPage />
              </Guard>
            }
          />
          <Route
            path="/employer/profile/:userId"
            element={
              <Guard role="employer">
                <EmployerProfilePage />
              </Guard>
            }
          />
          <Route
            path="/employer/job-postings/create"
            element={
              <Guard role="employer">
                <JobPostingPage />
              </Guard>
            }
          />
          <Route
            path="/employer/job-postings/:jobId/edit"
            element={
              <Guard role="employer">
                <JobEditPage />
              </Guard>
            }
          />
          <Route
            path="/admin"
            element={
              <Guard role="admin">
                <AdminDashboardPage />
              </Guard>
            }
          />
          <Route
            path="/professor"
            element={
              <Guard role="professor">
                <ProfessorDashboardPage />
              </Guard>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
