import axiosInstance from "@lib/axios";
import {
  completeMultipartUploadUrl,
  getDownloadUrlUrl,
  getImageUrl,
  getPresignUrlsUrl,
  getStaticFileUrl,
  startMultipartUploadUrl,
  uploadImageUrl,
  uploadStaticUrl,
} from "./staticUrl";
import { LAUNCHER_RELEASES_PREFIX } from "@/constants/static";

const uploadStatic = ({ file, prefix }) => {
  const formData = new FormData();
  formData.append("file", file);
  if (prefix) formData.append("prefix", prefix);

  return axiosInstance.post(uploadStaticUrl, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const uploadImage = ({ file }) => {
  const formData = new FormData();
  formData.append("image", file);

  return axiosInstance.post(uploadImageUrl, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const getStaticById = (staticId) =>
  axiosInstance.get(getStaticFileUrl(staticId));

const getImageById = ({ imageId, variant = "small" }) =>
  axiosInstance.get(getImageUrl(imageId, variant), { responseType: "blob" });

const startMultipartUpload = (
  {
    originalFileName,
    lastModified,
    contentType,
    size,
    prefix = LAUNCHER_RELEASES_PREFIX,
    requestedPartNumbers,
  },
  config = {},
) =>
  axiosInstance.post(
    startMultipartUploadUrl,
    { originalFileName, lastModified, contentType, size, prefix, requestedPartNumbers },
    config,
  );

const completeMultipartUpload = ({ sessionId, parts }, config = {}) =>
  axiosInstance.post(completeMultipartUploadUrl, { sessionId, parts }, config);

const getUrlsForRetry = (body, config = {}) =>
  axiosInstance.post(getPresignUrlsUrl, body, config);

const getFileDownloadUrl = (staticId) =>
  axiosInstance.get(getDownloadUrlUrl(staticId));

export const staticApi = {
  uploadStatic,
  getFileDownloadUrl,
  getStaticById,
  uploadImage,
  getImageById,
  startMultipartUpload,
  completeMultipartUpload,
  getUrlsForRetry,
};
