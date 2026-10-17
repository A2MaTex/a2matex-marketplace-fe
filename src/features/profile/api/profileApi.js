import axios from "../../../common/api/axios";
import { updateMyProfileUrl, changePassword as changePasswordUrl } from "./profileUrl";

const updateMyProfile = (data) => axios.put(updateMyProfileUrl, data);

const changePasswordApi = ({ currentPassword, newPassword, confirmNewPassword }) =>
  axios.put(changePasswordUrl, {
    currentPassword,
    newPassword,
    confirmNewPassword,
  });

export const profileApi = {
  updateMyProfile,
  changePassword: changePasswordApi,
};
