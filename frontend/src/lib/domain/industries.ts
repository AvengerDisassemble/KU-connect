export type IndustryOption = {
  value: string;
  label: string;
};

export const INDUSTRY_OPTIONS_BASE: IndustryOption[] = [
  { value: "it-hardware-and-devices", label: "IT Hardware & Devices" },
  { value: "it-software", label: "IT Software" },
  { value: "it-services", label: "IT Services" },
  { value: "network-services", label: "Network Services" },
  { value: "emerging-tech", label: "Emerging Tech" },
  { value: "e-commerce", label: "E-commerce" },
  { value: "other", label: "Other" },
];

export const INDUSTRY_UI_TO_API: Record<string, string> = {
  "it-hardware-and-devices": "IT_HARDWARE_AND_DEVICES",
  "it-software": "IT_SOFTWARE",
  "it-services": "IT_SERVICES",
  "network-services": "NETWORK_SERVICES",
  "emerging-tech": "EMERGING_TECH",
  "e-commerce": "E_COMMERCE",
  other: "OTHER",
};

export const API_TO_INDUSTRY_UI: Record<string, string> = Object.fromEntries(
  Object.entries(INDUSTRY_UI_TO_API).map(([ui, api]) => [api, ui]),
);

export const INDUSTRY_LABEL_BY_API: Record<string, string> = Object.fromEntries(
  INDUSTRY_OPTIONS_BASE.map(({ value, label }) => [
    INDUSTRY_UI_TO_API[value],
    label,
  ]),
);
