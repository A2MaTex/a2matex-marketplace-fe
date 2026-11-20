import { MarketplaceContractError } from "./marketplaceContract.js";

const FRIENDLY_MESSAGES = {
  "Error.ProductNotFound": "This product is not available in the marketplace.",
  "Error.PublicPublisherNotFound": "This publisher is not available.",
  "Error.StaticNotFound": "This image is no longer available.",
  "Error.InvalidImageVariant": "The requested image size is not supported.",
};

const validationMessage = (messages) =>
  messages
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const message = typeof item.message === "string" ? item.message : null;
      const path = typeof item.path === "string" ? item.path : null;
      if (!message) return null;
      return path ? `${path}: ${message}` : message;
    })
    .filter(Boolean)
    .join(" · ");

export const toMarketplaceError = (
  error,
  fallbackMessage = "Unable to load marketplace data.",
) => {
  if (error instanceof MarketplaceContractError) {
    return {
      code: "CONTRACT_ERROR",
      message: "The marketplace returned data in an unsupported format.",
      status: null,
      field: null,
      retryable: true,
    };
  }

  const status = error?.response?.status ?? null;
  const rawMessage = error?.response?.data?.message;
  const validation = Array.isArray(rawMessage)
    ? validationMessage(rawMessage)
    : null;
  const code = typeof rawMessage === "string" ? rawMessage : null;
  const invalidUuid = validation?.includes("Invalid UUID");

  return {
    code: invalidUuid ? "INVALID_UUID" : code ?? (status ? `HTTP_${status}` : "NETWORK_ERROR"),
    message:
      (code && FRIENDLY_MESSAGES[code]) ||
      (invalidUuid ? "This product link is invalid." : validation) ||
      (status === 404 ? "The requested marketplace resource was not found." : fallbackMessage),
    status,
    field: Array.isArray(rawMessage) ? rawMessage[0]?.path ?? null : null,
    retryable: status === null || status === 429 || status >= 500,
  };
};
