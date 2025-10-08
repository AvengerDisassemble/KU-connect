import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import { Guard } from "@/components/Guard";
import LandingPage from "@/pages/public/LandingPage";
import LoginPage from "@/pages/public/LoginPage";
import NotFoundPage from "@/pages/public/NotFoundPage";
import StudentDashboardPage from "@/pages/student/dashboard/DashboardPage";
import StudentProfilePage from "@/pages/student/profile/ProfilePage";
import BrowserJobsPage from "@/pages/student/browse-jobs/BrowseJobsPage";
import EmployerDashboardPage from "@/pages/employer/EmployerDashboard/DashboardPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboard/DashboardPage";
import ProfessorDashboardPage from "@/pages/professor/ProfessorDashboard/DashboardPage";

const App: React.FC = () => {
  return (
    <div className="min-h-dvh">
      <Header />
      <main className="container mx-auto max-w-screen-xl px-4 py-6">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/student"
            element={
              <Guard role="student">
                <StudentDashboardPage />
              </Guard>
            }
          />
          <Route
            path="/student/profile"
            element={
              <Guard role="student">
                <StudentProfilePage />
              </Guard>
            }
          />
          <Route
            path="/student/browsejobs"
            element={
              <Guard role="student">
                <BrowserJobsPage />
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
