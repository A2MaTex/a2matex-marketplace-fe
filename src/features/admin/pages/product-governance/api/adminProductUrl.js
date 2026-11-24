export const adminProductsUrl = "/products";

export const adminProductDetailUrl = (productId) =>
  `/products/${encodeURIComponent(productId)}`;

export const adminProductModerationUrl = (productId) =>
  `${adminProductDetailUrl(productId)}/moderation`;

export const adminProductReleasesUrl = (productId) =>
  `${adminProductDetailUrl(productId)}/releases`;

export const adminProductReleaseDetailUrl = (productId, releaseId) =>
  `${adminProductReleasesUrl(productId)}/${encodeURIComponent(releaseId)}`;

export const adminProductCurrentReleaseUrl = (productId) =>
  `${adminProductReleasesUrl(productId)}/current`;

export const adminProductReleaseLifecycleUrl = (productId, releaseId) =>
  `${adminProductReleaseDetailUrl(productId, releaseId)}/lifecycle`;
