import { loginUrl, logoutUrl, registerUrl, sendOTP } from "./authUrl";
import axios from "../../../common/api/axios.js";
import { useAuthStore } from "../store/authStore.js";
import { userApi } from "../../../common/api/user/userApi.js";

const login = async (account, password) => {
  const response = await axios.post(loginUrl, {
    account,
    password,
  });

  const { accessToken, refreshToken } = response.data.data;
  useAuthStore.getState().setCredentials(accessToken, refreshToken);

  const user = await userApi.getMyProfile();
  useAuthStore.getState().setUser(user);
  return user.roles.some((item) => item.name === "ADMIN");
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
