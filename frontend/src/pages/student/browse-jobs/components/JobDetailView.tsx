import { useState } from "react";
import {
  MapPin,
  Banknote,
  Calendar,
  Building2,
  Briefcase,
  CalendarClock,
  Clock,
  Home,
  Info,
  Loader2,
  Mail,
  MoreHorizontal,
  Phone,
  Flag,
  Tag,
  Globe,
  Users,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Job, JobDetail } from "@/services/jobs";
import { ReportJobDialog } from "./ReportJobDialog";
import {
  formatSalary,
  formatDeadline,
  getJobTypeColor,
  isJobApplicationClosed,
} from "../utils";

interface JobDetailViewProps {
  job: (Job | JobDetail) | null;
  onApply?: (jobId: string) => void;
  isApplied?: boolean;
  isApplying?: boolean;
  onToggleSave?: (jobId: string) => void;
  isSaved?: boolean;
  isSaving?: boolean;
  isLoadingDetail?: boolean;
}

interface JobActionsMenuProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
}

type DetailEntry = {
  id?: string;
  text?: string | null;
};

const normalizeDetailItems = (items?: DetailEntry[] | null) => {
  if (!Array.isArray(items)) {
    return [] as Array<{ id: string; text: string }>;
  }

  const normalized: Array<{ id: string; text: string }> = [];

  items.forEach((item, index) => {
    if (!item) return;
    const text = typeof item.text === "string" ? item.text.trim() : "";
    if (!text) return;

    const id =
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : `detail-${index}`;

    normalized.push({ id, text });
  });

  return normalized;
};

const JobActionsMenu = ({
  jobId,
  jobTitle,
  companyName,
}: JobActionsMenuProps) => {
  const [isReportOpen, setReportOpen] = useState(false);

  const handleReportClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setReportOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-primary"
            aria-label="Job actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={handleReportClick}
            className="text-red-600 focus:text-red-600"
          >
            <Flag className="mr-2 h-4 w-4" />
            Report job
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportJobDialog
        jobId={jobId}
        jobTitle={jobTitle}
        companyName={companyName}
        open={isReportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  );
};

const JobDetailView = ({
  job,
  onApply,
  isApplied = false,
  isApplying = false,
  onToggleSave,
  isSaved = false,
  isSaving = false,
  isLoadingDetail = false,
}: JobDetailViewProps) => {
  if (!job) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Select a job to view details
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose a job from the list to see more information
          </p>
        </div>
      </div>
    );
  }

  const formatPostedDate = (date?: string | null) => {
    if (!date) return "Posted recently";

    const posted = new Date(date);
    if (Number.isNaN(posted.getTime())) return "Posted recently";

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Posted today";
    if (diffDays < 7) return `Posted ${diffDays} days ago`;
    if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
    return `Posted ${Math.floor(diffDays / 30)} months ago`;
  };

  const getWorkArrangementColor = (arrangement?: string | null) => {
    const normalized = arrangement?.toLowerCase().replace(/[^a-z]/g, "");

    switch (normalized) {
      case "remote":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300";
      case "onsite":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300";
      case "hybrid":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  const showApplyButton = Boolean(onApply);
  const showSaveButton = Boolean(onToggleSave);
  const applicationsClosed = isJobApplicationClosed(job);

  const contactEmail = typeof job.email === "string" ? job.email.trim() : "";
  const contactPhone =
    typeof job.phone_number === "string" ? job.phone_number.trim() : "";
  const contactOther =
    typeof job.other_contact_information === "string"
      ? job.other_contact_information.trim()
      : "";

  const applicationStatusMessage = applicationsClosed
    ? "Applications for this role are closed."
    : job.application_deadline
    ? `Apply before ${formatDeadline(
        job.application_deadline
      )} to be considered for this opportunity.`
    : "This role remains open until filled.";

  const detailedJob = job as JobDetail | null;
  const requirements = normalizeDetailItems(detailedJob?.requirements);
  const qualifications = normalizeDetailItems(detailedJob?.qualifications);
  const responsibilities = normalizeDetailItems(detailedJob?.responsibilities);
  const benefits = normalizeDetailItems(detailedJob?.benefits);
  const tags = Array.isArray(job.tags)
    ? job.tags
        .map((tag) => (typeof tag?.name === "string" ? tag.name.trim() : ""))
        .filter(Boolean)
    : [];
  const hrProfile = detailedJob?.hr ?? null;

  const hrWebsiteRaw =
    typeof hrProfile?.website === "string" && hrProfile.website.trim()
      ? hrProfile.website.trim()
      : null;
  const hrWebsite = hrWebsiteRaw
    ? hrWebsiteRaw.match(/^https?:\/\//i)
      ? hrWebsiteRaw
      : `https://${hrWebsiteRaw}`
    : null;

  const hrCompanySize = hrProfile?.companySize
    ? hrProfile.companySize
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^\w/, (char: string) => char.toUpperCase())
    : null;

  const readableIndustry = hrProfile?.industry
    ? hrProfile.industry
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^\w/, (char: string) => char.toUpperCase())
    : null;
  const hrAddress =
    typeof hrProfile?.address === "string" && hrProfile.address.trim()
      ? hrProfile.address.trim()
      : null;
  const hrPhone =
    typeof hrProfile?.phoneNumber === "string" && hrProfile.phoneNumber.trim()
      ? hrProfile.phoneNumber.trim()
      : null;
  const companyDisplayName =
    hrProfile?.companyName || job.companyName || "Company";

  const detailSections = [
    {
      key: "requirements",
      title: "Requirements",
      items: requirements,
      empty: "Requirements not provided.",
    },
    {
      key: "qualifications",
      title: "Qualifications",
      items: qualifications,
      empty: "Qualifications not provided.",
    },
    {
      key: "responsibilities",
      title: "Responsibilities",
      items: responsibilities,
      empty: "Responsibilities not provided.",
    },
    {
      key: "benefits",
      title: "Benefits",
      items: benefits,
      empty: "Benefits not provided.",
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        {isLoadingDetail ? (
          <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading additional job details…</span>
          </div>
        ) : null}
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="mb-2 text-3xl font-bold text-foreground line-clamp-2">
                  {job.title || "Untitled role"}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {job.companyName || "Company name unavailable"}
                </p>
              </div>
            </div>
            <JobActionsMenu
              jobId={job.id}
              jobTitle={job.title || "Untitled role"}
              companyName={job.companyName || "Company name unavailable"}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className={getJobTypeColor(job.jobType)}>
              {job.jobType ?? "Job type"}
            </Badge>
            <Badge
              variant="outline"
              className={getWorkArrangementColor(job.workArrangement)}
            >
              {job.workArrangement ?? "Work arrangement"}
            </Badge>
            {applicationsClosed ? (
              <Badge variant="destructive" className="uppercase tracking-wide">
                Applications closed
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Clock className="h-4 w-4" />
            <span>{formatPostedDate(job.createdAt)}</span>
          </div>

          {showApplyButton || showSaveButton ? (
            <div className="flex flex-wrap gap-2">
              {showApplyButton ? (
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-none"
                  disabled={
                    !onApply || isApplied || isApplying || applicationsClosed
                  }
                  onClick={() => {
                    if (
                      !job ||
                      !onApply ||
                      isApplied ||
                      isApplying ||
                      applicationsClosed
                    ) {
                      return;
                    }
                    onApply(job.id);
                  }}
                >
                  {isApplying ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Applying…
                    </span>
                  ) : isApplied ? (
                    "Applied"
                  ) : applicationsClosed ? (
                    "Applications Closed"
                  ) : (
                    "Apply Now"
                  )}
                </Button>
              ) : null}
              {showSaveButton ? (
                <Button
                  variant="outline"
                  className={`border-border hover:bg-secondary flex-1 sm:flex-none min-w-[140px] ${
                    isSaved ? "bg-secondary text-secondary-foreground" : ""
                  }`}
                  disabled={!onToggleSave || isSaving}
                  onClick={() => {
                    if (!job || !onToggleSave || isSaving) return;
                    onToggleSave(job.id);
                  }}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </span>
                  ) : isSaved ? (
                    <span className="flex items-center gap-2">
                      <BookmarkCheck className="h-4 w-4" />
                      Saved
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4" />
                      Save Job
                    </span>
                  )}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <Separator className="my-6" />

        {/* Key Information */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Location</p>
              <p className="text-muted-foreground">
                {job.location || "Location not specified"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Banknote className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Salary Range</p>
              <p className="text-primary font-semibold">
                {formatSalary(job.minSalary, job.maxSalary)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                Application Deadline
              </p>
              <p className="text-muted-foreground">
                {formatDeadline(job.application_deadline)}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Role Details */}
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Role Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Position Type</p>
                <p className="text-muted-foreground">
                  {job.jobType || "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Home className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Work Arrangement</p>
                <p className="text-muted-foreground">
                  {job.workArrangement || "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarClock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Duration</p>
                <p className="text-muted-foreground">
                  {job.duration || "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Company</p>
                <p className="text-muted-foreground">
                  {job.companyName || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Job Description */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Job Description
          </h2>
          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
            <p>{job.description || "No description provided."}</p>
          </div>
        </div>

        <Separator className="my-6" />

        {tags.length ? (
          <div className="mb-6 space-y-3">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Tag className="h-5 w-5 text-muted-foreground" />
              Key Skills & Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="rounded-full px-3 py-1"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {hrProfile ? (
          <div className="mb-6 rounded-xl border border-border/80 bg-muted/40 p-6 shadow-inner">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  About the employer
                </p>
                <h3 className="text-2xl font-semibold text-foreground">
                  {companyDisplayName}
                </h3>
              </div>
              {hrWebsite ? (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a href={hrWebsite} target="_blank" rel="noreferrer">
                    Visit site
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {readableIndustry ? (
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Industry</p>
                    <p>{readableIndustry}</p>
                  </div>
                </div>
              ) : null}
              {hrCompanySize ? (
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Company size</p>
                    <p>{hrCompanySize}</p>
                  </div>
                </div>
              ) : null}
              {hrAddress ? (
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Address</p>
                    <p>{hrAddress}</p>
                  </div>
                </div>
              ) : null}
              {hrPhone ? (
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">HQ phone</p>
                    <p>{hrPhone}</p>
                  </div>
                </div>
              ) : null}
            </div>
            {hrProfile.description ? (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {hrProfile.description}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Role Expectations */}
        <div className="space-y-6 mb-6">
          {detailSections.map(({ key, title, items, empty }) => (
            <div key={key} className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              {items.length ? (
                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                  {items.map((item) => (
                    <li key={item.id}>{item.text}</li>
                  ))}
                </ul>
              ) : isLoadingDetail ? (
                <div className="space-y-2">
                  <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{empty}</p>
              )}
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        {/* Contact Information */}
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Contact Information
          </h2>
          {contactEmail || contactPhone || contactOther ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              {contactEmail ? (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    {contactEmail}
                  </a>
                </div>
              ) : null}
              {contactPhone ? (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    {contactPhone}
                  </a>
                </div>
              ) : null}
              {contactOther ? (
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="whitespace-pre-wrap">{contactOther}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Contact details will be shared once your application is submitted.
            </p>
          )}
        </div>

        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
          <h3 className="font-medium text-foreground mb-2">About this role</h3>
          <p className="text-sm text-muted-foreground">
            This position is posted by {job.companyName || "the employer"}.{" "}
            {applicationStatusMessage}
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobDetailView;
