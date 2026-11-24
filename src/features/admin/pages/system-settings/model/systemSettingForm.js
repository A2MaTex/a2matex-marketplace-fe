const BANK_KEYS = new Set([
  "SEPAY_BANK_ACCOUNT_NUMBER",
  "SEPAY_BANK_NAME",
  "SEPAY_BANK_ACCOUNT_HOLDER",
]);

export const stableValue = (value) => JSON.stringify(value ?? null);

export function createSystemSettingDraft(setting) {
  if (!setting.editable) return null;
  const values = Object.fromEntries(
    setting.schema.fields.map((field) => [field.name, String(setting.value[field.name])]),
  );
  return {
    values,
    initialValues: { ...values },
    serverSnapshot: stableValue(setting.value),
    stale: false,
  };
}

export const isSystemSettingDraftDirty = (draft) =>
  Boolean(draft) && stableValue(draft.values) !== stableValue(draft.initialValues);

export function validateSystemSettingDraft(setting, draft) {
  const errors = {};
  const value = {};
  if (!setting.editable || !draft) {
    return { valid: false, errors: { _form: "This setting cannot be edited." }, value: null };
  }

  for (const field of setting.schema.fields) {
    const raw = draft.values[field.name] ?? "";
    if (field.type === "integer") {
      if (!/^-?\d+$/.test(raw.trim())) {
        errors[field.name] = "Enter a whole number.";
        continue;
      }
      const parsed = Number(raw);
      if (!Number.isSafeInteger(parsed)) errors[field.name] = "Enter a safe whole number.";
      else if (field.min !== undefined && parsed < field.min) errors[field.name] = `Minimum value is ${field.min}.`;
      else if (field.max !== undefined && parsed > field.max) errors[field.name] = `Maximum value is ${field.max}.`;
      else value[field.name] = parsed;
      continue;
    }

    const normalized = BANK_KEYS.has(setting.key) ? raw.trim() : raw;
    if (BANK_KEYS.has(setting.key) && !normalized) errors[field.name] = "Bank configuration cannot be blank.";
    else if (field.maxLength !== undefined && normalized.length > field.maxLength) {
      errors[field.name] = `Use ${field.maxLength} characters or fewer.`;
    } else value[field.name] = normalized;
  }

  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function commissionPercent(value) {
  return Number.isSafeInteger(value) ? `${value / 100}%` : "—";
}

export function deriveSepayStatus(items) {
  const keys = [...BANK_KEYS];
  const settings = keys.map((key) => items.find((item) => item.key === key));
  if (settings.some((setting) => !setting || !setting.editable)) return "UNKNOWN";
  return settings.every((setting) => String(setting.value.value).trim())
    ? "CONFIGURED"
    : "INCOMPLETE";
}
