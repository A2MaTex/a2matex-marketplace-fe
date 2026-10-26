import axios from "axios";
import { auth } from "./token";
import { authApi } from "@/features/auth/api/authApi";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

const axiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request: attach Bearer token ────────────────────────
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

// ─── Response: auto-retry 500 + 401 token refresh ────────

// Tracks an in-flight refresh so concurrent 401s share one call
let refreshPromise = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message;

    // ── 500 auto-retry (up to 3 attempts) ──────────────
    if (status === 500) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      if (config._retryCount <= 3) {
        // Exponential back-off: 300ms, 600ms, 1200ms
        await new Promise((resolve) =>
          setTimeout(resolve, 300 * config._retryCount),
        );
        return axiosInstance(config);
      }
    }

    // ── 401 + InvalidAccessToken: try refresh ──────────
    if (status === 401 && message === "Error.InvalidAccessToken") {
      const refreshToken = auth.getRefreshToken();

      // No refresh token available — reject immediately
      if (!refreshToken) {
        return Promise.reject(error);
      }

      // Prevent multiple concurrent refresh calls
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            await authApi.refreshAccessToken(refreshToken);
          } finally {
            refreshPromise = null;
          }
        })();
      }

      try {
        await refreshPromise;
        // Retry original request with the new access token
        config.headers.Authorization = `Bearer ${auth.getToken()}`;
        return axiosInstance(config);
      } catch (refreshError) {
        // Refresh failed — reject with the original error
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
