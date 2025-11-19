const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

export const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) {
    return "Just now";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString(undefined, {
    ...DATE_FORMAT,
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (value?: string | null, fallback = "—") => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString(undefined, DATE_FORMAT);
};

export const describeTimeUntilDeadline = (
  value?: string | null
): string | null => {
  if (!value) {
    return null;
  }

  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) {
    return null;
  }

  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  if (diff <= 0) {
    return "Deadline passed";
  }

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 1) {
    return "Due tomorrow";
  }
  if (days < 7) {
    return `Due in ${days} day${days === 1 ? "" : "s"}`;
  }
  const weeks = Math.ceil(days / 7);
  if (weeks < 5) {
    return `Due in ${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  const months = Math.ceil(days / 30);
  return `Due in ${months} month${months === 1 ? "" : "s"}`;
};

export type WorkArrangement = "On-site" | "Hybrid" | "Remote" | "Flexible";

export const detectWorkArrangement = (
  location?: string | null
): WorkArrangement => {
  const normalized = location?.toLowerCase() ?? "";

  if (normalized.includes("remote")) {
    return "Remote";
  }
  if (normalized.includes("hybrid")) {
    return "Hybrid";
  }
  if (normalized.includes("flexible")) {
    return "Flexible";
  }
  return "On-site";
};

export const isUpcomingDeadline = (
  value?: string | null,
  withinDays = 7
) => {
  if (!value) {
    return false;
  }

  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) {
    return false;
  }

  const now = new Date();
  const diffDays =
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= withinDays;
};
