import axios from "axios";
import { getStaticFileUrl, uploadStaticUrl } from "./staticUrl";

const uploadStatic = ({ file, prefix }) =>
  axios.post(uploadStaticUrl, {
    file,
    prefix,
  });

const getStaticById = (staticId) => axios.get(getStaticFileUrl(staticId));

export const staticApi = {
  uploadStatic,
  getStaticById,
};
