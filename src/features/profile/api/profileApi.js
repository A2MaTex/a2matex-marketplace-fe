import axios from "axios";
import { updateMyProfileUrl } from "./profileUrl";

const updateMyProfile = (data) => axios.put(updateMyProfileUrl, data);
const changePassword = ({ currentPassword, newPassword, confirmNewPassword }) =>
  axios.put(updateMyProfileUrl, {
    currentPassword,
    newPassword,
    confirmNewPassword,
  });

export const profileApi = {
  updateMyProfile,
  changePassword,
};
