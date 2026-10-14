import { useAuthStore } from "../../../features/auth/store/authStore.js";
import axios from "../axios.js";
import { getMeUrl } from "./userUrl.js";

const getMyProfile = async () => {
  const response = await axios.get(getMeUrl);
  useAuthStore.getState().setUser(response.data.data);
  return response.data.data;
};

export const userApi = { getMyProfile };
