import { create } from "zustand";
import { auth } from "@lib/token";

export const useAuthStore = create((set) => ({
  accessToken: auth.getToken(),
  refreshToken: auth.getRefreshToken(),
  user: null,
  isAuthenticated: Boolean(auth.getToken()),

  setCredentials: (accessToken, refreshToken) => {
    auth.setToken(accessToken);
    auth.setRefreshToken(refreshToken);

    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    auth.removeToken();
    auth.removeRefreshToken();

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
