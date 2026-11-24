import axios from "axios";
import { auth } from "./token";
import { refreshSession } from "@/features/auth/api/refreshSession";
import { useAuthStore } from "@/features/auth/store/authStore";
import { API_BASE_URL } from "./apiBaseUrl";
import { redirectToLogin, requiresLogin } from "./sessionRedirect";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
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

const expireSession = () => {
  useAuthStore.getState().logout();
  redirectToLogin();
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;

    // ── 500 auto-retry (up to 3 attempts) ──────────────
    if (status === 500 && config) {
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
    if (requiresLogin(error)) {
      const refreshToken = auth.getRefreshToken();

      const canRefresh =
        status === 401 &&
        Boolean(auth.getToken()) &&
        Boolean(refreshToken) &&
        Boolean(config) &&
        !config._retryAfterRefresh;

      if (!canRefresh) {
        expireSession();
        return Promise.reject(error);
      }

      // Prevent multiple concurrent refresh calls
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            await refreshSession(refreshToken);
          } finally {
            refreshPromise = null;
          }
        })();
      }

      try {
        await refreshPromise;
        // Retry original request with the new access token
        config._retryAfterRefresh = true;
        config.headers.Authorization = `Bearer ${auth.getToken()}`;
        return axiosInstance(config);
      } catch {
        expireSession();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
