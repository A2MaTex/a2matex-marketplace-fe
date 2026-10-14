import { loginUrl, logoutUrl, registerUrl, sendOTP } from "./authUrl";
import axios from "../../../common/api/axios.js";
import { useAuthStore } from "../store/authStore.js";

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
  const response = await axios.post(logoutUrl);
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
export const authApi = {
  login,
  register,
  logout,
  sendOtp,
};
