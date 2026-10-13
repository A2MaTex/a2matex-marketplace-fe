import axios from "../axios.js";
import { getMeUrl } from "./userUrl.js";

const getMyProfile = async () => {
  const response = await axios.get(getMeUrl);
  return response.data.data;
};

export const userApi = { getMyProfile };
