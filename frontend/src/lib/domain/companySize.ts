export type CompanySizeOption = {
  value: string;
  label: string;
};

export const COMPANY_SIZE_OPTIONS: CompanySizeOption[] = [
  { value: "one-to-ten", label: "1-10 employees" },
  { value: "eleven-to-fifty", label: "11-50 employees" },
  { value: "fifty-one-to-two-hundred", label: "51-200 employees" },
  { value: "two-hundred-plus", label: "200+ employees" },
];

export const COMPANY_SIZE_UI_TO_API: Record<string, string> = {
  "one-to-ten": "ONE_TO_TEN",
  "eleven-to-fifty": "ELEVEN_TO_FIFTY",
  "fifty-one-to-two-hundred": "FIFTY_ONE_TO_TWO_HUNDRED",
  "two-hundred-plus": "TWO_HUNDRED_PLUS",
};

export const API_TO_COMPANY_SIZE_UI: Record<string, string> =
  Object.fromEntries(
    Object.entries(COMPANY_SIZE_UI_TO_API).map(([ui, api]) => [api, ui]),
  );

export const COMPANY_SIZE_LABEL_BY_API: Record<string, string> =
  Object.fromEntries(
    COMPANY_SIZE_OPTIONS.map(({ value, label }) => [
      COMPANY_SIZE_UI_TO_API[value],
      label,
    ]),
  );
