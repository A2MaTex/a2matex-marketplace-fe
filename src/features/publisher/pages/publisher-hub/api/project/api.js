import axiosInstance from "@/lib/axios";
import { getProjectDraftUrl, getProjectUrl, getProjectsUrl } from "./url";

const getProjects = ({ page = 1, limit = 10, status, signal } = {}) =>
  axiosInstance.get(getProjectsUrl, {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
    },
    signal,
  });

const getProject = (projectId, { signal } = {}) =>
  axiosInstance.get(getProjectUrl(projectId), { signal });

const getProjectDraft = (projectId, { signal } = {}) =>
  axiosInstance.get(getProjectDraftUrl(projectId), { signal });

// Kept for the legacy product form until it is moved to Products & Offers.
const getAllProjects = () => getProjects();

export const publisherProjectApi = {
  getProjects,
  getAllProjects,
  getProject,
  getProjectDraft,
};
