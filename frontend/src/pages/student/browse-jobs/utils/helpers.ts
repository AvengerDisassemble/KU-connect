import type { Job } from "@/services/jobs";

export const formatSalary = (
  minSalary?: number | null,
  maxSalary?: number | null
): string => {
  const hasMin = typeof minSalary === "number" && Number.isFinite(minSalary);
  const hasMax = typeof maxSalary === "number" && Number.isFinite(maxSalary);

  const min = hasMin ? (minSalary as number) : null;
  const max = hasMax ? (maxSalary as number) : null;

  if (min === null && max === null) {
    return "Salary negotiable";
  }

  if (min !== null && max !== null) {
    if (min === max) {
      return `${min.toLocaleString()} THB/month`;
    }
    return `${min.toLocaleString()} - ${max.toLocaleString()} THB/month`;
  }

  if (min !== null) {
    return `From ${min.toLocaleString()} THB/month`;
  }

  if (max !== null) {
    return `Up to ${max.toLocaleString()} THB/month`;
  }

  return "Salary negotiable";
};

export const formatDeadline = (dateString?: string | null): string => {
  if (!dateString) {
    return "Open until filled";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Open until filled";
  }

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
};

export { formatRelativeTime } from "@/utils/formatRelativeTime";

export const getJobTypeColor = (type?: string | null): string => {
  const normalized = type?.toLowerCase();

  switch (normalized) {
    case "full-time":
      return "bg-primary/10 text-primary border-primary/20";
    case "part-time":
      return "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100";
    case "internship":
      return "bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-950 dark:text-sky-200";
    case "contract":
      return "bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950 dark:text-purple-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

type JobLike = Pick<Job, "application_deadline"> & {
  status?: string | null;
};

const isClosedStatus = (status?: string | null): boolean => {
  if (!status) return false;
  return status.trim().toLowerCase() === "closed";
};

const isDeadlineInPast = (deadline?: string | null): boolean => {
  if (!deadline) return false;
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < Date.now();
};

export const isJobApplicationClosed = (job?: JobLike | null): boolean => {
  if (!job) return false;

  if (isClosedStatus(job.status)) {
    return true;
  }

  return isDeadlineInPast(job.application_deadline);
};
