import {
  BarChart3,
  BookmarkCheck,
  BriefcaseBusiness,
  Building2,
  FilePlus,
  GraduationCap,
  Home,
  Megaphone,
  ShieldCheck,
  UserCircle,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AppSidebarItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
};

export interface SidebarConfigOptions {
  userId?: string;
}

export const studentSidebar = (userId?: string): AppSidebarItem[] => {
  const profilePath = userId
    ? `/student/profile/${userId}`
    : "/student/profile";

  return [
    { label: "Dashboard", to: "/student", icon: Home, end: true },
    {
      label: "Browse Jobs",
      to: "/student/browse-jobs",
      icon: BriefcaseBusiness,
    },
    { label: "Profile", to: profilePath, icon: UserCircle },
    {
      label: "My Applications",
      to: "/student/applications",
      icon: BookmarkCheck,
    },
  ];
};

export const employerSidebar = (userId?: string): AppSidebarItem[] => {
  const companyProfilePath = userId
    ? `/employer/profile/${userId}`
    : "/employer/profile";

  return [
    { label: "Dashboard", to: "/employer", icon: Home, end: true },
    {
      label: "Post New Job",
      to: "/employer/job-postings/create",
      icon: FilePlus,
    },
    {
      label: "Browse Jobs",
      to: "/employer/browse-jobs",
      icon: BriefcaseBusiness,
    },
    { label: "Company Profile", to: companyProfilePath, icon: Building2 },
  ];
};

export const adminSidebar = (): AppSidebarItem[] => [
  { label: "Dashboard", to: "/admin", icon: BarChart3, end: true },
  { label: "User Management", to: "/admin/users", icon: UsersRound },
  { label: "Announcements", to: "/admin/announcements", icon: Megaphone },
  { label: "Browse Jobs", to: "/admin/browse-jobs", icon: BriefcaseBusiness },
  { label: "Reports", to: "/admin/reports", icon: ShieldCheck },
];

export const professorSidebar = (): AppSidebarItem[] => [
  { label: "Dashboard", to: "/professor", icon: GraduationCap, end: true },
  {
    label: "Browse Jobs",
    to: "/professor/browse-jobs",
    icon: BriefcaseBusiness,
  },
];

export function getSidebarConfig(
  role?: string | null,
  options: SidebarConfigOptions = {}
): AppSidebarItem[] {
  const normalizedRole = role?.toLowerCase();

  switch (normalizedRole) {
    case "student":
      return studentSidebar(options.userId);
    case "employer":
      return employerSidebar(options.userId);
    case "admin":
      return adminSidebar();
    case "professor":
      return professorSidebar();
    default:
      return [];
  }
}
