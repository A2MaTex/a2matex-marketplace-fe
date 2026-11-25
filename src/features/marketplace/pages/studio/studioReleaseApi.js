import publicAxios from "@/lib/publicAxios";

export const studioReleaseApi = {
  getCurrent(config = {}) {
    return publicAxios.get("/studio-releases/current", config);
  },
};
