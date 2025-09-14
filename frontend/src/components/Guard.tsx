import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type Role } from "@/hooks/useAuth";

interface GuardProps {
  role?: Role;
  children: React.ReactNode;
}

export const Guard: React.FC<GuardProps> = ({ role, children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/403" replace />;
  }

  return children;
};
