import { CommerceContractError } from "./commerceContract.js";

const FRIENDLY_MESSAGES = {
  "Error.OrderIdempotencyKeyRequired":
    "Purchase protection could not be initialized. Please refresh and try again.",
  "Error.OrderIdempotencyKeyReused":
    "This purchase key belongs to another offer. Review the offer and confirm again.",
  "Error.ProductOfferNotFound":
    "This offer is no longer available. We refreshed the product offers.",
  "Error.ProductNotFound": "This product is no longer available.",
  "Error.ProductNotPurchasable":
    "This product is not available for purchase right now.",
  "Error.OrderCustomerProfileNotFound":
    "Complete your customer profile before purchasing this product.",
  "Error.EntitlementRevoked":
    "Access to this product was revoked. Contact support before trying again.",
  "Error.EntitlementStillActive":
    "You already have active access to this product.",
  "Error.OneTimeOfferAlreadyUsed":
    "This one-time offer has already been used. Choose a subscription instead.",
  "Error.InsufficientBalance":
    "Your balance is too low for this offer. Add funds, then retry safely.",
  "Error.OrderOperationTimeout":
    "The server is still confirming this purchase. Retry with the same protected request.",
  "Error.OrderNotFound":
    "This order is unavailable or does not belong to your account.",
};

const validationMessage = (message) => {
  if (!Array.isArray(message)) return null;
  return message
    .map((issue) => {
      if (typeof issue?.message !== "string") return null;
      return typeof issue.path === "string"
        ? `${issue.path}: ${issue.message}`
        : issue.message;
    })
    .filter(Boolean)
    .join(" · ");
};

export const isCanceledCommerceRequest = (error) =>
  error?.code === "ERR_CANCELED" || error?.name === "CanceledError";

export const toCommerceError = (
  error,
  fallbackMessage = "We could not complete this purchase.",
) => {
  if (error instanceof CommerceContractError) {
    return {
      code: "INVALID_RESPONSE",
      status: null,
      message:
        "The commerce service returned an unsupported response. Refresh the page or contact support if the problem continues.",
      uncertain: true,
      retryableSameIntent: true,
    };
  }

  const status = error?.response?.status ?? null;
  const rawMessage = error?.response?.data?.message;
  const code = typeof rawMessage === "string" ? rawMessage : null;
  const timedOut =
    error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT";
  const networkFailure = status === null && !isCanceledCommerceRequest(error);
  const uncertain =
    timedOut ||
    networkFailure ||
    status === 503 ||
    status >= 500 ||
    code === "Error.OrderOperationTimeout";
  const validation = validationMessage(rawMessage);

  return {
    code:
      code ??
      (status ? `HTTP_${status}` : timedOut ? "TIMEOUT" : "NETWORK_ERROR"),
    status,
    message:
      FRIENDLY_MESSAGES[code] ??
      validation ??
      (status === 401
        ? "Your session expired. Sign in again, then retry this protected purchase."
        : status === 403
          ? "Your account is not allowed to make this purchase."
          : fallbackMessage),
    uncertain,
    retryableSameIntent: uncertain || status === 429,
  };
};

export const COMMERCE_ERROR_MESSAGES = FRIENDLY_MESSAGES;
