export function getInitials(
  firstName?: string | null,
  lastName?: string | null
): string {
  const safeFirst = (firstName ?? "").trim();
  const safeLast = (lastName ?? "").trim();

  if (safeFirst && safeLast) {
    return `${safeFirst[0]}${safeLast[0]}`.toUpperCase();
  }

  if (safeFirst) {
    return safeFirst[0].toUpperCase();
  }

  if (safeLast) {
    return safeLast[0].toUpperCase();
  }

  return "U";
}
