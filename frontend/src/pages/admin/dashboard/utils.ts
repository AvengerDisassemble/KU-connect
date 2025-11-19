export const formatNumber = (value?: number) =>
  typeof value === "number" ? value.toLocaleString() : "-";
