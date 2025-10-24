import { useState } from "react";

import DashboardHeader from "./DashboardHeader";
import NotificationBanner from "./NotificationBanner";
import StatCard from "./StatCard";
import JobCard, { type Job } from "./JobCard";
import ApplicantRow, { type Applicant } from "./ApplicantRow";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const EmployerDashboardContent = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const stats = { openJobs: 3, newApplicationsToday: 8, offersMade: 2 };

  const jobs: Job[] = [
    { id: "1", title: "Senior Frontend Developer", applicants: 24, shortlisted: 5, postedDate: "3 days ago", location: "Bangkok", status: "open" },
    { id: "2", title: "Mobile App Developer", applicants: 18, shortlisted: 3, postedDate: "1 week ago", location: "Remote", status: "open" },
    { id: "3", title: "Data Science Intern", applicants: 31, shortlisted: 8, postedDate: "5 days ago", location: "Hybrid", status: "open" },
  ];

  const applicants: Applicant[] = [
    { id: "1", name: "Sunthorn Kompita", major: "Computer Engineering", year: 4, appliedRole: "Senior Frontend Developer", lastUpdate: "2 hours ago" },
    { id: "2", name: "Panthawat Lueangsiriwattana", major: "Software Engineering", year: 3, appliedRole: "Mobile App Developer", lastUpdate: "1 day ago" },
    { id: "3", name: "Tanasatit Ngaosupathon", major: "Software Engineering", year: 4, appliedRole: "Data Science Intern", lastUpdate: "2 days ago" },
    { id: "4", name: "Thanawat Tanijaroensin", major: "Computer Engineering", year: 4, appliedRole: "Senior Frontend Developer", lastUpdate: "3 days ago" },
    { id: "5", name: "Phasit Ruangmak", major: "Software Engineering", year: 3, appliedRole: "Mobile App Developer", lastUpdate: "4 hours ago" },
  ];

  const filteredApplicants = applicants.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-2 sm:px-4">
      <DashboardHeader onPostJob={() => console.log("Post new job")} />

      <NotificationBanner newApplications={5}/>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
        <StatCard label="Open Jobs" value={stats.openJobs} />
        <StatCard label="New Applications Today" value={stats.newApplicationsToday} />
        <StatCard label="Offers Made" value={stats.offersMade} />
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search applicants by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card className="overflow-hidden rounded-2xl border-0 shadow-md">
            <div className="flex items-center justify-between border-b border-border p-6">
              <h2 className="text-xl font-bold">My Open Jobs</h2>
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[var(--brand-teal)] px-3 text-sm font-semibold text-white">
                {jobs.length}
              </span>
            </div>
            <div className="divide-y divide-border">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  variant="list"
                  onViewApplicants={(id) => console.log("View applicants", id)}
                  onEditJob={(id) => console.log("Edit job", id)}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="overflow-hidden rounded-2xl border-0 p-0 shadow-md">
            <div className="flex items-center justify-between p-6">
              <h2 className="text-xl font-bold">Applicants Inbox</h2>
              <Badge variant="default" className="rounded-full">
                {filteredApplicants.length}
              </Badge>
            </div>

            <div className="hidden grid-cols-12 items-center gap-4 border-y border-border bg-[var(--neutral-bg-1)] px-6 py-3 md:grid">
              <p className="col-span-5 text-sm font-semibold uppercase leading-none text-[var(--neutral-text-secondary)]">
                Student
              </p>
              <p className="col-span-3 text-sm font-semibold uppercase leading-none text-[var(--neutral-text-secondary)]">
                Applied Role
              </p>
              <p className="col-span-2 text-sm font-semibold uppercase leading-none text-[var(--neutral-text-secondary)]">
                Submitted Time
              </p>
              <p className="col-span-2 text-right text-sm font-semibold uppercase leading-none text-[var(--neutral-text-secondary)]">
                Actions
              </p>
            </div>

            <div className="px-6">
              {filteredApplicants.map((applicant) => (
                <ApplicantRow
                  key={applicant.id}
                  applicant={applicant}
                  onView={(id) => console.log("View applicant", id)}
                  onApprove={(id) => console.log("Approve applicant", id)}
                  onReject={(id) => console.log("Reject applicant", id)}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboardContent;
