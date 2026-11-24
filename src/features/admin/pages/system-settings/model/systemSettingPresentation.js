const PRESENTATION = {
  COMMISSION_RATE_BPS: {
    label: "Marketplace commission",
    description:
      "Percentage of each order retained by the marketplace. 3,000 basis points equals 30%.",
    group: "commerce",
    fieldLabels: { rateBps: "Commission rate (basis points)" },
  },
  SEPAY_BANK_ACCOUNT_NUMBER: {
    label: "Bank account number",
    description:
      "Bank account number used to receive customer top-up transfers.",
    group: "sepay",
    fieldLabels: { value: "Account number" },
  },
  SEPAY_BANK_NAME: {
    label: "Receiving bank",
    description:
      "Receiving bank name used to generate VietQR payment codes.",
    group: "sepay",
    fieldLabels: { value: "Bank name" },
  },
  SEPAY_BANK_ACCOUNT_HOLDER: {
    label: "Account holder",
    description:
      "Account holder name displayed with bank transfer instructions.",
    group: "sepay",
    fieldLabels: { value: "Account holder name" },
  },
};

const titleCaseKey = (key) =>
  key
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

export const settingPresentation = (key) =>
  PRESENTATION[key] ?? { label: titleCaseKey(key), group: "other", fieldLabels: {} };

export const settingFieldLabel = (setting, field) =>
  settingPresentation(setting.key).fieldLabels[field.name] ?? titleCaseKey(field.name);

export const settingDescription = (setting) =>
  settingPresentation(setting.key).description ?? setting.description;

export const settingGroup = (setting) => settingPresentation(setting.key).group;
