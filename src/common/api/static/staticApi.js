import axiosInstance from "@lib/axios";
import {
  getImageUrl,
  getStaticFileUrl,
  uploadImageUrl,
  uploadStaticUrl,
} from "./staticUrl";

const uploadStatic = ({ file, prefix }) => {
  const formData = new FormData();
  formData.append("file", file);
  if (prefix) formData.append("prefix", prefix);

  return axiosInstance.post(uploadStaticUrl, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const uploadImage = ({ file, prefix }) => {
  const formData = new FormData();
  formData.append("image", file);
  if (prefix) formData.append("prefix", prefix);

  return axiosInstance.post(uploadImageUrl, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const getStaticById = (staticId) =>
  axiosInstance.get(getStaticFileUrl(staticId));

const getImageById = ({ imageId, variant = "small" }) =>
  axiosInstance.get(getImageUrl(imageId, variant), { responseType: "blob" });

export const staticApi = {
  uploadStatic,
  getStaticById,
  uploadImage,
  getImageById,
};
