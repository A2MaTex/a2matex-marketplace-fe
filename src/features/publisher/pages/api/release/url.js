export const getProductReleasesUrl = (productId) =>
  `/products/${productId}/releases`;

export const getProductReleaseUrl = (productId, releaseId) =>
  `/products/${productId}/releases/${releaseId}`;

export const selectCurrentProductReleaseUrl = (productId) =>
  `/products/${productId}/releases/current`;
