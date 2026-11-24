import { AdminUserContractError } from "./adminUserModel.js";

const MESSAGES = {
  "Error.UserNotFound": "This user no longer exists.",
  "Error.UserStatusConflict":
    "The user status changed in another session. Refresh and try again.",
  "Error.UserStatusTransitionDenied":
    "This status change is no longer allowed. Refresh the user and try again.",
  "Error.UserSelfBanDenied": "You cannot ban your own account.",
  "Error.AdminTargetProtected":
    "Administrator accounts are protected from status changes.",
};

const validationMessage = (message) => {
  if (!Array.isArray(message)) return { message: null, field: null };
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
    message: issues.map((issue) => issue.message).join(" · ") || null,
    field: issues.length === 1 ? issues[0].field : null,
  };
};

export const toAdminUserError = (
  error,
  fallbackMessage = "The user operation could not be completed.",
) => {
  if (error instanceof AdminUserContractError) {
    return {
      code: "INVALID_INPUT",
      status: null,
      field: error.field,
      message: error.message,
      conflict: false,
      retryable: false,
    };
  }

  const status = error?.response?.status ?? null;
  const rawMessage = error?.response?.data?.message;
  const code = typeof rawMessage === "string" ? rawMessage : null;
  const validation = validationMessage(rawMessage);
  const statusMessage = {
    403: "Your account is not allowed to manage users.",
    404: "This user no longer exists.",
    503: "User management is temporarily unavailable.",
  }[status];

  return {
    code: code ?? (status === 403 ? "FORBIDDEN" : "UNKNOWN"),
    status,
    field: validation.field,
    message:
      validation.message ?? MESSAGES[code] ?? statusMessage ?? fallbackMessage,
    conflict:
      status === 409 ||
      code === "Error.UserStatusConflict" ||
      code === "Error.UserStatusTransitionDenied",
    retryable: status === null || status === 408 || status === 503,
  };
};
