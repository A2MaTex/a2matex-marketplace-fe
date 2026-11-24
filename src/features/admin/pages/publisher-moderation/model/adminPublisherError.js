import { AdminPublisherContractError } from "./adminPublisherContract";

const MESSAGES = {
  "Error.PublisherAccountNotFound": "This Publisher account no longer exists.",
  "Error.PublisherStatusConflict":
    "The Publisher status changed in another session. The latest record is being refreshed.",
  "Error.PublisherRoleUnavailable":
    "The Publisher role is temporarily unavailable. Try again after the role configuration is restored.",
  "Error.PublisherAccessDenied":
    "Your account is not allowed to manage Publisher accounts.",
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

export const toAdminPublisherError = (
  error,
  fallbackMessage = "The Publisher operation could not be completed.",
) => {
  if (error instanceof AdminPublisherContractError) {
    return {
      code: "INVALID_INPUT",
      status: null,
      field: error.field,
      message: error.message,
      conflict: false,
      retryable: false,
      uncertain: false,
    };
  }

  const status = error?.response?.status ?? null;
  const rawMessage = error?.response?.data?.message;
  const code = typeof rawMessage === "string" ? rawMessage : null;
  const validation = validationMessage(rawMessage);
  const statusMessage = {
    403: "Your account is not allowed to manage Publisher accounts.",
    404: "This Publisher account no longer exists.",
    503: "Publisher moderation is temporarily unavailable.",
  }[status];

  return {
    code: code ?? (status === 403 ? "FORBIDDEN" : "UNKNOWN"),
    status,
    field: validation.field,
    message:
      validation.message ?? MESSAGES[code] ?? statusMessage ?? fallbackMessage,
    conflict: status === 409 || code === "Error.PublisherStatusConflict",
    retryable:
      status === null || status === 408 || status === 429 || status === 503,
    uncertain: status === null || status === 408,
  };
};
