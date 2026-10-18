import axios from "axios";
import { auth } from "./token";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

const axiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach Bearer Token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = auth.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Centralized response error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized responses here if needed.
      // Example: clear expired access token or trigger logout.
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
