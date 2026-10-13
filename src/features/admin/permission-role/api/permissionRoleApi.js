import axios from "../../../../common/api/axios.js";
import {
  addRoleUrl,
  getPermissionsOfRoleUrl,
  getPermissionsUrl,
  getRolesUrl,
  saveRolePermissionsUrl,
} from "./permissionRoleUrl.js";

const getAllRoles = async () => {
  const response = await axios.get(getRolesUrl);
  return response.data.data.items;
};

const getAllPermissions = async () => {
  const response = await axios.get(getPermissionsUrl);
  return response.data.data.items;
};

const getRolePermissions = async (roleId) => {
  const response = await axios.get(getPermissionsOfRoleUrl(roleId));
  return response.data.data.items;
};

const saveRolePermissions = async (roleId, permissionIds) => {
  const response = await axios.put(saveRolePermissionsUrl(roleId), {
    permissionIds,
  });
  return response.data;
};

const createRole = async ({ name, description }) => {
  const response = await axios.post(addRoleUrl, { name, description });
  return response.data.data;
};

export const permissionRoleApi = {
  getAllRoles,
  getAllPermissions,
  getRolePermissions,
  saveRolePermissions,
  createRole,
};
