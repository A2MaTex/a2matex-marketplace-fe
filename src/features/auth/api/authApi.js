import {
  loginUrl,
  logoutUrl,
  registerUrl,
  sendOTP,
  forgotPasswordUrl,
  refreshTokenUrl,
  googleSocialLoginUrl,
  githubSocialLoginUrl,
} from "./authUrl";
import axios from "@lib/axios.js";
import publicAxios from "@/lib/publicAxios.js";
import { useAuthStore } from "../store/authStore.js";
import { auth } from "@/lib/token";

const login = async (account, password) => {
  const response = await axios.post(loginUrl, {
    account,
    password,
  });

  const { accessToken, refreshToken } = response.data.data;
  useAuthStore.getState().setCredentials(accessToken, refreshToken);
  useAuthStore.getState().setUser(null);
};

const register = async ({
  fullName,
  username,
  email,
  password,
  confirmPassword,
  code,
}) => {
  const response = await axios.post(registerUrl, {
    fullName,
    username,
    email,
    password,
    confirmPassword,
    code,
  });
  return response.data;
};
const logout = async () => {
  const response = await axios.post(logoutUrl, {
    refreshToken: auth.getRefreshToken(),
  });
  useAuthStore.getState().logout();
  return response.data;
};
const sendOtp = async ({ email, type = "REGISTER" }) => {
  const response = await axios.post(sendOTP, {
    email,
    type,
  });

  return response.data;
};

const refreshAccessToken = async (refreshToken) => {
  const response = await axios.post(refreshTokenUrl, {
    refreshToken,
  });

  const { accessToken, refreshToken: newRefreshToken } = response.data.data;
  useAuthStore.getState().setCredentials(accessToken, newRefreshToken);
};

const socialLogin = async (provider, code, redirectUri) => {
  const endpoints = {
    google: googleSocialLoginUrl,
    github: githubSocialLoginUrl,
  };
  const endpoint = endpoints[provider];

  if (!endpoint) {
    throw new Error("Unsupported social login provider.");
  }

  // OAuth authorization codes are single-use. publicAxios has no automatic
  // 500 retry or auth-refresh interceptor, so this request is sent only once.
  const response = await publicAxios.post(endpoint, { code, redirectUri });
  const credentials = response.data?.data;
  if (!credentials?.accessToken || !credentials?.refreshToken) {
    throw new Error("Social login response did not include credentials.");
  }

  return credentials;
};

const forgotPassword = async ({
  email,
  code,
  newPassword,
  confirmNewPassword,
}) => {
  const response = await axios.post(forgotPasswordUrl, {
    email,
    code,
    newPassword,
    confirmNewPassword,
  });
  return response.data;
};

export const authApi = {
  login,
  register,
  logout,
  sendOtp,
  forgotPassword,
  refreshAccessToken,
  socialLogin,
};
