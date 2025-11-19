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
import TranscriptUploadPage from "@/pages/student/profile/TranscriptUploadPage";
import BrowseJobsPage from "@/pages/student/browse-jobs/BrowseJobsPage";
import EmployerLayout from "@/components/layout/EmployerLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import EmployerDashboardPage from "@/pages/employer/EmployerDashboard/DashboardPage";
import EmployerProfilePage from "@/pages/employer/profile/ProfilePage";
import ProfessorDashboardPage from "@/pages/professor/dashboard/DashboardPage";
import ProfessorAnalyticsPage from "@/pages/professor/insight/InsightPage";
import ProfessorLayout from "@/components/layout/ProfessorLayout";
import JobPostingPage from "@/pages/employer/JobPosting/JobPostingPage";
import JobEditPage from "@/pages/employer/JobPosting/JobEditPage";
import AdminDashboardPage from "@/pages/admin/dashboard/AdminDashboardPage";
import UserManagementPage from "@/pages/admin/user-management/UserManagementPage";
import AnnouncementManagementPage from "@/pages/admin/announcement-management/AnnouncementPage";
import ReportManagementPage from "@/pages/admin/report-management/ReportManagementPage";
import { FloatingNotificationButton } from "@/components/notifications";
const EmployerBrowseJobsRoute: React.FC = () => (
  <EmployerLayout title="Browse Jobs">
    <BrowseJobsPage />
  </EmployerLayout>
);

const AdminBrowseJobsRoute: React.FC = () => (
  <AdminLayout
    title="Browse Jobs"
    description="Review job listings available on the platform."
  >
    <BrowseJobsPage />
  </AdminLayout>
);

const ProfessorBrowseJobsRoute: React.FC = () => (
  <ProfessorLayout
    title="Browse Jobs"
    description="Curated opportunities for your mentees and advisees."
  >
    <BrowseJobsPage />
  </ProfessorLayout>
);

const App: React.FC = () => {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Header />
      <div className="flex-1">
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
            path="/student/upload-transcript"
            element={
              <Guard role="student">
                <TranscriptUploadPage />
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
                <ProfessorBrowseJobsRoute />
              </Guard>
            }
          />
          <Route
            path="/admin/browse-jobs"
            element={
              <Guard role="admin">
                <AdminBrowseJobsRoute />
              </Guard>
            }
          />
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
            path="/admin/users"
            element={
              <Guard role="admin">
                <UserManagementPage />
              </Guard>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <Guard role="admin">
                <AnnouncementManagementPage />
              </Guard>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <Guard role="admin">
                <ReportManagementPage />
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
          <Route
            path="/professor/analytics"
            element={
              <Guard role="professor">
                <ProfessorAnalyticsPage />
              </Guard>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <FloatingNotificationButton />
    </div>
  );
};

export default App;
