export const formatBytes = (
  bytes: number | undefined | null,
  fractionDigits = 1
): string | null => {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) {
    return null;
  }

  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(fractionDigits)} ${units[exponent]}`;
};
