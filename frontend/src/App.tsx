import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Guard } from "@/components/Guard";
import LandingPage from "@/pages/public/LandingPage";
import LoginPage from "@/pages/public/LoginPage";
import NotFoundPage from "@/pages/public/NotFoundPage";
import StudentDashboardPage from "@/pages/student/DashboardPage";
import EmployerDashboardPage from "@/pages/employer/DashboardPage";
import AdminDashboardPage from "@/pages/admin/DashboardPage";
import ProfessorDashboardPage from "@/pages/professor/DashboardPage";

const App: React.FC = () => {
  return (
    <div className="min-h-dvh">
      <main className="container mx-auto max-w-screen-xl px-4 py-6">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/student" element={<Guard role="student"><StudentDashboardPage /></Guard>} />
          <Route path="/employer" element={<Guard role="employer"><EmployerDashboardPage /></Guard>} />
          <Route path="/admin" element={<Guard role="admin"><AdminDashboardPage /></Guard>} />
          <Route path="/professor" element={<Guard role="professor"><ProfessorDashboardPage /></Guard>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
