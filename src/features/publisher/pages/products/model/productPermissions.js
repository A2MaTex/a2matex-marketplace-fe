export const canEditProduct = (status) => status === "DRAFT" || status === "ACTIVE";
export const canArchiveProduct = (status) => status === "ACTIVE";
export const canReviewActivationReadiness = (status) =>
  status === "DRAFT" || status === "ARCHIVED";
export const isProductReadOnly = (status) => !canEditProduct(status);
