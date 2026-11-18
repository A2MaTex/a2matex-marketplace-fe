export const canEditProduct = (status) => status === "DRAFT" || status === "ACTIVE";
export const canArchiveProduct = (status) => status === "DRAFT";
export const isProductReadOnly = (status) => !canEditProduct(status);
