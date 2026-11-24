import axiosInstance from "@lib/axios";
import {
  adminUserDetailUrl,
  adminUsersUrl,
  adminUserStatusUrl,
} from "./adminUserUrl";

const list = ({ params, signal } = {}) =>
  axiosInstance.get(adminUsersUrl, { params, signal });

const detail = (userId, { signal } = {}) =>
  axiosInstance.get(adminUserDetailUrl(userId), { signal });

const updateStatus = (userId, data) =>
  axiosInstance.put(adminUserStatusUrl(userId), data);

export const adminUserApi = { list, detail, updateStatus };
