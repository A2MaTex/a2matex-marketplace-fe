import axiosInstance from "@lib/axios";
import { useAuthStore } from "@features/auth/store/authStore";
import { getMeUrl } from "./userUrl";
import { auth } from "@/lib/token";

const getMyProfile = async () => {
  if (!auth.getToken()) {
    throw new Error("You have not logged in.");
  }

  const response = await axiosInstance.get(getMeUrl);
  useAuthStore.getState().setUser(response.data.data);
  return response.data.data;
};

export const userApi = { getMyProfile };
