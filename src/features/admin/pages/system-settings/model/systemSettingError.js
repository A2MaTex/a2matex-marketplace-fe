import { SystemSettingContractError } from "./systemSettingContract";

const validationIssue = (message) => {
  if (!Array.isArray(message)) return { field: null, message: null };
  const issues = message
    .map((issue) => {
      if (typeof issue?.message !== "string") return null;
      const field = Array.isArray(issue.path)
        ? issue.path.join(".")
        : typeof issue.path === "string"
          ? issue.path
          : null;
      return { field, message: issue.message };
    })
    .filter(Boolean);
  return {
    field: issues.length === 1 ? issues[0].field : null,
    message: issues.map((issue) => issue.message).join(" · ") || null,
  };
};

export function toSystemSettingError(error, fallback = "The system setting operation could not be completed.") {
  if (error instanceof SystemSettingContractError) {
    return { status: null, code: "INVALID_CONTRACT", field: error.field, message: error.message, retryable: true };
  }
  const status = error?.response?.status ?? null;
  const raw = error?.response?.data?.message;
  const validation = validationIssue(raw);
  const code = typeof raw === "string" ? raw : null;
  const messages = {
    403: "Your account is not allowed to manage system settings.",
    404: "This setting is no longer registered. Refresh the registry.",
    503: "System settings are temporarily unavailable.",
  };
  return {
    status,
    code: code ?? "UNKNOWN",
    field: validation.field,
    message: validation.message ?? messages[status] ?? fallback,
    retryable: status === null || status === 408 || status === 503,
  };
}
