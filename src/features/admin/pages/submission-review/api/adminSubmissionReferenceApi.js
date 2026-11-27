import axiosInstance from "@/lib/axios";

const encoded = (value) => encodeURIComponent(value);

const user = (userId, { signal } = {}) =>
  axiosInstance.get(`/admin/users/${encoded(userId)}`, { signal });

const publisher = (publisherAccountId, { signal } = {}) =>
  axiosInstance.get(`/publishers/${encoded(publisherAccountId)}`, { signal });

const project = (projectId, { signal } = {}) =>
  axiosInstance.get(`/projects/${encoded(projectId)}`, { signal });

export const adminSubmissionReferenceApi = { user, publisher, project };
