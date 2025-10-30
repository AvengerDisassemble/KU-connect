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

export const formatRelativeTime = (dateString?: string | null): string => {
  if (!dateString) {
    return "Just now";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const units = [
    { seconds: 31536000, label: "y" },
    { seconds: 2592000, label: "mo" },
    { seconds: 86400, label: "d" },
    { seconds: 3600, label: "h" },
    { seconds: 60, label: "m" },
    { seconds: 1, label: "s" },
  ];

  for (const unit of units) {
    const count = Math.floor(seconds / unit.seconds);
    if (count >= 1) {
      return `${count}${unit.label} ago`;
    }
  }

  return "Just now";
};

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
