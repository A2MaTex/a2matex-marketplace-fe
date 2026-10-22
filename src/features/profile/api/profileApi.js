import axios from "@lib/axios";
import {
  updateMyProfileUrl,
  changePassword as changePasswordUrl,
  activatePublisherAccountUrl,
} from "./profileUrl";

const updateMyProfile = (data) => axios.put(updateMyProfileUrl, data);

const changePassword = ({ currentPassword, newPassword, confirmNewPassword }) =>
  axios.put(changePasswordUrl, {
    currentPassword,
    newPassword,
    confirmNewPassword,
  });

const activatePublisherAccount = (termId) =>
  axios.post(activatePublisherAccountUrl, { termId });

export const profileApi = {
  updateMyProfile,
  changePassword,
  activatePublisherAccount
};
