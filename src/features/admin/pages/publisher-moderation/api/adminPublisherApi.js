import axiosInstance from "@lib/axios";
import {
  adminPublisherDetailUrl,
  adminPublishersUrl,
  adminPublisherStatusUrl,
} from "./adminPublisherUrl";

const list = ({ params, signal } = {}) =>
  axiosInstance.get(adminPublishersUrl, { params, signal });

const detail = (publisherAccountId, { signal } = {}) =>
  axiosInstance.get(adminPublisherDetailUrl(publisherAccountId), { signal });

const updateStatus = (publisherAccountId, data) =>
  axiosInstance.patch(adminPublisherStatusUrl(publisherAccountId), data);

export const adminPublisherApi = { list, detail, updateStatus };
