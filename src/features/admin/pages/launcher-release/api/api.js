import axiosInstance from "@/lib/axios";
import {
  activateReleaseUrl,
  createNewReleaseUrl,
  getAllReleaseUrl,
  getCurrentReleaseUrl,
  getDetailReleaseUrl,
  updateReleaseUrl,
} from "./url";

const getAllRelease = () => axiosInstance.get(getAllReleaseUrl);

const getDetailRelease = (id) => axiosInstance.get(getDetailReleaseUrl(id));

const createRelease = (body) => axiosInstance.post(createNewReleaseUrl, body);

const updateRelease = (id, body) =>
  axiosInstance.put(updateReleaseUrl(id), body);

const activateRelease = (id) => axiosInstance.put(activateReleaseUrl(id));

const getCurrentRelease = () => axiosInstance.get(getCurrentReleaseUrl);

export const releaseApi = {
  getAllRelease,
  getDetailRelease,
  createRelease,
  updateRelease,
  activateRelease,
  getCurrentRelease
};
