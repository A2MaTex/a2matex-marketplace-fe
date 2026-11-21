import { ProductContractError } from "./productContract";
import { ProductValidationError } from "./productForm";

const ERROR_MESSAGES = {
  "Error.PublisherUserNotActive": "Your publisher user is not active.",
  "Error.PublisherNotActivated": "Activate your publisher account before managing products.",
  "Error.PublisherBlocked": "This publisher account is currently blocked.",
  "Error.PublisherTermsNotAccepted": "Accept the current publisher terms before continuing.",
  "Error.PublisherAccessDenied": "You do not have access to this product.",
  "Error.ProductAccessDenied": "You do not have access to this product.",
  "Error.ProjectNotFound": "The selected project is no longer available.",
  "Error.ProductNotFound": "This product could not be found.",
  "Error.ProductAlreadyExists": "The selected project already has a product.",
  "Error.ProductSlugConflict": "This slug is already in use.",
  "Error.ProductMediaInvalid": "One or more product images are invalid.",
  "Error.ProductSuspended": "This product is suspended and can no longer be edited.",
  "Error.ProductArchived": "This product is archived and can no longer be edited.",
  "Error.ProductCannotBeArchived": "The current product status cannot be archived.",
  "Error.ProductLifecycleUnavailable": "Publisher lifecycle actions are unavailable for this product.",
};

export const toPublisherProductError = (error, fallbackMessage) => {
  if (error instanceof ProductValidationError) {
    return { code: "VALIDATION_ERROR", message: error.message, field: error.field, retryable: false };
  }
  if (error instanceof ProductContractError) {
    return {
      code: "CONTRACT_ERROR",
      message: "The product service returned data in an unsupported format.",
      field: null,
      retryable: true,
    };
  }
  const code = error?.response?.data?.message ?? null;
  const status = error?.response?.status ?? null;
  return {
    code: code ?? (status ? `HTTP_${status}` : "NETWORK_ERROR"),
    message:
      ERROR_MESSAGES[code] ??
      (status === 401 ? "Your session has expired. Please sign in again." : fallbackMessage),
    field: code === "Error.ProductSlugConflict" ? "slug" : null,
    retryable: status === null || status === 429 || status >= 500,
  };
};
