import { AdminProductContractError } from "./adminProductContract";

const MESSAGES = {
  "Error.ProductNotFound": "This Product no longer exists.",
  "Error.ProductModerationUnavailable":
    "The Product status changed. Refresh to review its latest state.",
  "Error.ProductAccessDenied":
    "Your account is not allowed to manage this Product.",
  "Error.ProductCannotBeSuspended":
    "This Product cannot be suspended in its current state.",
  "Error.ProductCannotBeReactivated":
    "This Product is not ready to be reactivated.",
  "Error.ProductReleaseUnavailable":
    "The current release is missing or does not have a complete package.",
  "Error.ProductSubscriptionOfferRequired":
    "An eligible subscription offer is required before reactivation.",
  "Error.ProductSuspendReasonRequired": "A suspension reason is required.",
  "Error.ProductReleaseNotFound": "This release no longer exists.",
  "Error.ProductReleaseNotSelectable":
    "This release is not eligible to become the current release.",
  "Error.ProductReleaseSelectionUnavailable":
    "Current-release selection is unavailable for this Product state.",
  "Error.ProductReleaseNotDisableable":
    "Only a published release can be disabled.",
  "Error.ProductReleaseDisableConflict":
    "This release was already disabled with different moderation evidence.",
  "Error.ProductReleaseReplacementRequired":
    "Choose an eligible replacement before disabling the current release.",
  "Error.ProductReleaseReplacementInvalid":
    "The selected replacement is no longer eligible. Choose another release.",
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

export const toAdminProductError = (
  error,
  fallbackMessage = "The Product operation could not be completed.",
) => {
  if (error instanceof AdminProductContractError) {
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
    403: "Your account is not allowed to manage Products and releases.",
    404: "The requested Product or release no longer exists.",
    409: "The record changed in another session. Refresh and try again.",
    422: "The request is not valid for the current Product or release state.",
    503: "Product governance is temporarily unavailable.",
  }[status];
  return {
    code: code ?? (status === 403 ? "FORBIDDEN" : "UNKNOWN"),
    status,
    field: validation.field,
    message: validation.message ?? MESSAGES[code] ?? statusMessage ?? fallbackMessage,
    conflict: status === 409,
    retryable: status === null || [408, 429, 503].includes(status),
    uncertain: status === null || status === 408,
  };
};
