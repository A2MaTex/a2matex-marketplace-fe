import { CommerceContractError } from "../../../../commerce/model/commerceContract.js";
import { AdminEntitlementInputError } from "./adminEntitlementRequest.js";

const MESSAGES = {
  "Error.EntitlementNotFound": "The entitlement no longer exists.",
  "Error.EntitlementAlreadyRevoked": "This entitlement was already revoked.",
  "Error.EntitlementCustomerNotFound": "No customer was found for this UUID.",
  "Error.ProductNotFound": "No product was found for this UUID.",
  "Error.EntitlementProductNotActive":
    "The selected product is not active and cannot receive a new grant.",
  "Error.EntitlementInvalidExpiresAt":
    "The expiry is not in the future according to the server clock.",
  "Error.EntitlementOperationTimeout":
    "The operation timed out while waiting for another entitlement update. Refresh before retrying.",
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
      uncertain: false,
      verifyRequired: false,
    };
  }

  if (error instanceof CommerceContractError) {
    return {
      code: "INVALID_RESPONSE",
      status: null,
      field: null,
      message:
        "The server returned an unsupported entitlement response. Refresh to verify the authoritative state.",
      conflict: false,
      retryable: false,
      uncertain: true,
      verifyRequired: true,
    };
  }

  const status = error?.response?.status ?? null;
  const rawMessage = error?.response?.data?.message;
  const code = typeof rawMessage === "string" ? rawMessage : null;
  const validation = validationMessage(rawMessage);
  const conflict =
    code === "Error.EntitlementAlreadyRevoked" || (status === 409 && !code);
  const uncertain = status === null || status === 408;
  const operationTimeout = code === "Error.EntitlementOperationTimeout";

  return {
    code: code ?? (status === 403 ? "FORBIDDEN" : "UNKNOWN"),
    status,
    field: validation.field,
    message:
      validation.message ??
      MESSAGES[code] ??
      ({
        403: "Your account is not allowed to manage entitlements.",
        404: "The requested entitlement resource was not found.",
        503: "Entitlement management is temporarily unavailable.",
      }[status] || fallbackMessage),
    conflict,
    retryable: uncertain || status === 429 || status === 503,
    uncertain,
    verifyRequired: uncertain || conflict || operationTimeout,
  };
};
