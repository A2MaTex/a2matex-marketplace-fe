import { ProductOfferValidationError } from "./productOfferForm.js";

const MESSAGES = {
  "Error.ProductOfferInvalid": "Check the offer type, price and duration values.",
  "Error.ProductOfferLimitExceeded": "This product has reached the maximum number of offers.",
  "Error.ProductOfferDuplicate": "Offer type and duration must be unique.",
  "Error.ProductOfferSuspendedProduct": "Offers cannot be changed while the product is suspended.",
  "Error.ProductOfferArchivedProduct": "Offers cannot be changed on an archived product.",
  "Error.ProductSubscriptionOfferRequired": "An active product must keep at least one subscription offer.",
  "Error.ProductOfferChangeRateLimitExceeded": "The active product offer-change limit has been reached. Try again after the rolling window expires.",
  "Error.ProductOfferReplaceTimeout": "The product is busy with another lifecycle change. Retry the full replacement.",
  "Error.ProductNotFound": "This product is no longer available.",
};

const responseCode = (error) => {
  const message = error?.response?.data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    return message.find((item) => typeof item?.message === "string")?.message ?? null;
  }
  return null;
};

export const toProductOfferError = (error) => {
  if (error instanceof ProductOfferValidationError) {
    return {
      code: "VALIDATION_ERROR",
      message: error.message,
      path: error.path,
      retryable: false,
    };
  }
  const code = responseCode(error);
  const status = error?.response?.status ?? null;
  return {
    code: code ?? (status ? `HTTP_${status}` : "NETWORK_ERROR"),
    message:
      MESSAGES[code] ??
      (status === 401
        ? "Your session has expired. Please sign in again."
        : "Unable to save product offers."),
    path: null,
    retryable: status === null || status === 429 || status >= 500,
  };
};
