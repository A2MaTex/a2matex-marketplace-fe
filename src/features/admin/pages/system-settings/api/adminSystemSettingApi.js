import axiosInstance from "@/lib/axios";
import {
  adminSystemSettingUrl,
  adminSystemSettingsUrl,
} from "./adminSystemSettingUrl";

const list = ({ signal } = {}) =>
  axiosInstance.get(adminSystemSettingsUrl, { signal });

const update = (key, value) =>
  axiosInstance.patch(
    adminSystemSettingUrl(key),
    { value },
    { skipServerErrorRetry: true },
  );

export const adminSystemSettingApi = { list, update };
