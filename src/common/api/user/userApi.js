import axiosInstance from "@lib/axios";
import { useAuthStore } from "@features/auth/store/authStore";
import { getMeUrl } from "./userUrl";
import { cacheImage, getCachedImage } from "@/lib/cache";
import { staticApi } from "../static/staticApi";

const getMyProfile = async () => {
  const response = await axiosInstance.get(getMeUrl);
  const user = response.data.data;
  useAuthStore.getState().setUser(user);
  let imgBlob;
  if (user.avatarStaticId) {
    const avatar = await getCachedImage(user.id);

    if (!avatar) {
      const res = await staticApi.getImageById({
        imageId: user.avatarStaticId,
      });
      imgBlob = res.data;
      await cacheImage(user.id, imgBlob);
    } else {
      imgBlob = avatar;
    }
    useAuthStore.getState().setAvatarBlob(imgBlob);
  }
  return { user, imgBlob };
};

export const userApi = { getMyProfile };
