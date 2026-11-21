import { ReleaseContractError } from "./releaseContract";

const MESSAGES = {
  "Error.ProductNotFound": "This product is no longer available.",
  "Error.ProductReleaseNotFound": "This release is no longer available.",
  "Error.ProductReleaseSelectionUnavailable": "The product lifecycle does not allow changing its current release.",
  "Error.ProductReleaseNotSelectable": "This release is not published with a complete package.",
  "Error.ProductReleaseUnavailable": "The current release is no longer eligible for activation.",
  "Error.ProductSubscriptionOfferRequired": "Add at least one valid subscription offer before activation.",
  "Error.ProductCannotBeActivated": "This product cannot be activated from its current state.",
  "Error.ProductCannotBeReactivated": "This product cannot be reactivated from its current state.",
  "Error.ProductLifecycleUnavailable": "Publisher lifecycle actions are unavailable for this product.",
  "Error.ProductSuspended": "This product is suspended and cannot be changed by a Publisher.",
  "Error.ProductArchived": "This product is archived. Review readiness before reactivating it.",
};

export const isCanceledReleaseRequest = (error) => error?.code === "ERR_CANCELED";

export const toPublisherReleaseError = (error, fallbackMessage) => {
  if (error instanceof ReleaseContractError) {
    return {
      code: "CONTRACT_ERROR",
      message: "The release service returned data in an unsupported format.",
      retryable: true,
      conflict: false,
    };
  }
  const code = error?.response?.data?.message ?? null;
  const status = error?.response?.status ?? null;
  return {
    code: code ?? (status ? `HTTP_${status}` : "NETWORK_ERROR"),
    message:
      MESSAGES[code] ??
      (status === 401 ? "Your session has expired. Please sign in again." : fallbackMessage),
    retryable: status === null || status === 429 || status >= 500,
    conflict: status === 409,
  };
};
