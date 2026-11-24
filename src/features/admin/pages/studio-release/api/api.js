import axiosInstance from "@/lib/axios";
import {
  activateReleaseUrl,
  createNewReleaseUrl,
  deactivateReleaseUrl,
  getAllReleaseUrl,
  getCurrentReleaseUrl,
  getDetailReleaseUrl,
  updateReleaseUrl,
} from "./url";

const getAllRelease = (params, config = {}) =>
  axiosInstance.get(getAllReleaseUrl, { ...config, params });
const getDetailRelease = (id, config = {}) =>
  axiosInstance.get(getDetailReleaseUrl(id), config);
const createRelease = (body) => axiosInstance.post(createNewReleaseUrl, body);
const updateRelease = (id, body) => axiosInstance.put(updateReleaseUrl(id), body);
const activateRelease = (id) => axiosInstance.put(activateReleaseUrl(id));
const deactivateRelease = (id) => axiosInstance.put(deactivateReleaseUrl(id));
const getCurrentRelease = (config = {}) => axiosInstance.get(getCurrentReleaseUrl, config);

export const studioReleaseApi = {
  getAllRelease,
  getDetailRelease,
  createRelease,
  updateRelease,
  activateRelease,
  deactivateRelease,
  getCurrentRelease,
};
