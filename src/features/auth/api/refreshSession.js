import publicAxios from "@/lib/publicAxios.js";
import { refreshTokenUrl } from "./authUrl.js";
import { useAuthStore } from "../store/authStore.js";

export const refreshSession = async (refreshToken) => {
  const response = await publicAxios.post(refreshTokenUrl, { refreshToken });
  const credentials = response.data?.data;

  if (!credentials?.accessToken || !credentials?.refreshToken) {
    throw new Error("Refresh response did not include credentials.");
  }

  useAuthStore
    .getState()
    .setCredentials(credentials.accessToken, credentials.refreshToken);

  return credentials;
};
