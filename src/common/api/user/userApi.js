import axiosInstance from "@lib/axios";
import { useAuthStore } from "@features/auth/store/authStore";
import { getMeUrl } from "./userUrl";

const getMyProfile = async () => {
  const response = await axiosInstance.get(getMeUrl);
  useAuthStore.getState().setUser(response.data.data);
  return response.data.data;
};

export const userApi = { getMyProfile };
