const MINUTE_IN_MS = 60 * 1000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const WEEK_IN_MS = 7 * DAY_IN_MS;

export function formatRelativeTime(
  input: string | Date,
  now = new Date()
): string {
  const value = typeof input === "string" ? new Date(input) : new Date(input);
  if (Number.isNaN(value.getTime())) {
    return "unknown";
  }

  const diff = now.getTime() - value.getTime();
  if (diff < 0) {
    return "just now";
  }

  if (diff < MINUTE_IN_MS) {
    const seconds = Math.floor(diff / 1000);
    return seconds <= 1 ? "just now" : `${seconds} seconds ago`;
  }

  if (diff < HOUR_IN_MS) {
    const minutes = Math.floor(diff / MINUTE_IN_MS);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (diff < DAY_IN_MS) {
    const hours = Math.floor(diff / HOUR_IN_MS);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  if (diff < WEEK_IN_MS) {
    const days = Math.floor(diff / DAY_IN_MS);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return value.toLocaleDateString();
}
