import axiosInstance from "@lib/axios";
import {
  adminProductCurrentReleaseUrl,
  adminProductDetailUrl,
  adminProductModerationUrl,
  adminProductReleaseDetailUrl,
  adminProductReleaseLifecycleUrl,
  adminProductReleasesUrl,
  adminProductsUrl,
} from "./adminProductUrl";

const list = ({ params, signal } = {}) =>
  axiosInstance.get(adminProductsUrl, { params, signal });

const detail = (productId, { signal } = {}) =>
  axiosInstance.get(adminProductDetailUrl(productId), { signal });

const moderate = (productId, data) =>
  axiosInstance.put(adminProductModerationUrl(productId), data);

const listReleases = (productId, { params, signal } = {}) =>
  axiosInstance.get(adminProductReleasesUrl(productId), { params, signal });

const releaseDetail = (productId, releaseId, { signal } = {}) =>
  axiosInstance.get(adminProductReleaseDetailUrl(productId, releaseId), {
    signal,
  });

const selectCurrentRelease = (productId, data) =>
  axiosInstance.put(adminProductCurrentReleaseUrl(productId), data);

const disableRelease = (productId, releaseId, data) =>
  axiosInstance.put(
    adminProductReleaseLifecycleUrl(productId, releaseId),
    data,
  );

export const adminProductApi = {
  list,
  detail,
  moderate,
  listReleases,
  releaseDetail,
  selectCurrentRelease,
  disableRelease,
};
