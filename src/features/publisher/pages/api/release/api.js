import axiosInstance from "@/lib/axios";
import {
  getProductReleaseUrl,
  getProductReleasesUrl,
  selectCurrentProductReleaseUrl,
} from "./url";

const getReleases = ({ productId, page = 1, limit = 10, signal }) =>
  axiosInstance.get(getProductReleasesUrl(productId), {
    params: { page, limit },
    signal,
  });

const getRelease = ({ productId, releaseId, signal }) =>
  axiosInstance.get(getProductReleaseUrl(productId, releaseId), { signal });

const selectCurrent = ({ productId, releaseId }) =>
  axiosInstance.put(selectCurrentProductReleaseUrl(productId), { releaseId });

export const publisherReleaseApi = {
  getReleases,
  getRelease,
  selectCurrent,
};
