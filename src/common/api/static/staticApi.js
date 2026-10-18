import axiosInstance from "@lib/axios";
import { getStaticFileUrl, uploadStaticUrl } from "./staticUrl";

const uploadStatic = ({ file, prefix }) =>
  axiosInstance.post(uploadStaticUrl, {
    file,
    prefix,
  });

const getStaticById = (staticId) =>
  axiosInstance.get(getStaticFileUrl(staticId));

export const staticApi = {
  uploadStatic,
  getStaticById,
};
