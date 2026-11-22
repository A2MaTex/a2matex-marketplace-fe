import { AdminEntitlementInputError } from "./adminEntitlementRequest.js";

const MESSAGES = {
  "Error.EntitlementNotFound": "The entitlement no longer exists.",
  "Error.EntitlementAlreadyRevoked": "This entitlement was already revoked.",
  "Error.CustomerNotFound": "No customer was found for this UUID.",
  "Error.ProductNotFound": "No product was found for this UUID.",
  "Error.ProductNotActive": "The selected product is not active.",
  "Error.ProductNotPurchasable": "The selected product cannot receive access.",
};

const validationMessage = (message) => {
  if (!Array.isArray(message)) return null;
  return message
    .map((issue) =>
      typeof issue?.message === "string"
        ? `${issue.path ? `${issue.path}: ` : ""}${issue.message}`
        : null,
    )
    .filter(Boolean)
    .join(" · ");
};

export const toAdminEntitlementError = (
  error,
  fallbackMessage = "The entitlement operation could not be completed.",
) => {
  if (error instanceof AdminEntitlementInputError) {
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

  return {
    code: code ?? (status === 403 ? "FORBIDDEN" : "UNKNOWN"),
    status,
    field: null,
    message:
      validation ??
      MESSAGES[code] ??
      (status === 403
        ? "Your account is not allowed to manage entitlements."
        : fallbackMessage),
    conflict:
      status === 409 || code === "Error.EntitlementAlreadyRevoked",
    retryable: status === null || status === 408 || status === 503,
  };
};
