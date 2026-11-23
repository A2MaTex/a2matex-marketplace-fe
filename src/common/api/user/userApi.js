import axiosInstance from "@lib/axios";
import { useAuthStore } from "@features/auth/store/authStore";
import { getMeUrl } from "./userUrl";
import { cacheImage, getCachedImage } from "@/lib/cache";
import { staticApi } from "../static/staticApi";

let myProfileRequest;
let latestProfileRequestId = 0;

const loadMyProfile = async () => {
  const requestId = ++latestProfileRequestId;
  const response = await axiosInstance.get(getMeUrl);
  const user = response.data.data;
  const authStore = useAuthStore.getState();
  const sameAvatar =
    authStore.user?.avatarStaticId === user.avatarStaticId;
  let imgBlob = sameAvatar ? authStore.avatarBlob : null;

  // A later forced refresh owns the store. An older response must not restore
  // the pre-purchase balance after the newer request has started.
  if (requestId !== latestProfileRequestId) {
    return { user, imgBlob: null };
  }

  // Balance and profile fields should update as soon as /profiles/me resolves.
  // Avatar hydration is intentionally separate so an image/cache failure cannot
  // leave the Header showing stale account data.
  authStore.setUser({ ...user, imgBlob });
  authStore.setAvatarBlob(imgBlob);

  if (!user.avatarStaticId || imgBlob) {
    return { user, imgBlob };
  }

  try {
    imgBlob = await getCachedImage(user.id);

    if (!imgBlob) {
      const res = await staticApi.getImageById({
        imageId: user.avatarStaticId,
      });
      imgBlob = res.data;
      await cacheImage(user.id, imgBlob);
    }

    if (requestId === latestProfileRequestId) {
      const latestStore = useAuthStore.getState();
      latestStore.setAvatarBlob(imgBlob);
      latestStore.setUser({ ...user, imgBlob });
    }
  } catch (error) {
    // Profile data is already current; a failed avatar must not turn a
    // successful balance refresh into a profile refresh failure.
    console.error("Unable to load the profile avatar.", error);
  }

  return { user, imgBlob };
};

const getMyProfile = ({ forceRefresh = false } = {}) => {
  if (myProfileRequest && !forceRefresh) return myProfileRequest;

  let trackedRequest;
  trackedRequest = loadMyProfile().finally(() => {
    if (myProfileRequest === trackedRequest) {
      myProfileRequest = null;
    }
  });
  myProfileRequest = trackedRequest;

  return trackedRequest;
};

export const userApi = { getMyProfile };
