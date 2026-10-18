import axios from "@lib/axios.js";
import {
  addPermissionUrl,
  addRoleUrl,
  deletePermissionUrl,
  deleteRoleUrl,
  editPermissionUrl,
  getPermissionsOfRoleUrl,
  getPermissionsUrl,
  getRolesUrl,
  saveRolePermissionsUrl,
} from "./permissionRoleUrl.js";

const createPermission = async (permission) => {
  const response = await axios.post(addPermissionUrl, permission);
  return response.data.data.id;
};

const updatePermission = async (id, permission) => {
  const response = await axios.put(editPermissionUrl(id), permission);
  return response.data;
};

const deletePermission = async (id) => {
  const response = await axios.delete(deletePermissionUrl, {
    data: { ids: [id] },
  });
  return response.data;
};

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

  return response.data.data.id;
};

const deleteRole = async (...roleIds) => {
  await axios.delete(deleteRoleUrl, {
    data: { ids: roleIds },
  });
};

export const permissionRoleApi = {
  createPermission,
  updatePermission,
  deletePermission,
  getAllRoles,
  getAllPermissions,
  getRolePermissions,
  saveRolePermissions,
  deleteRole,
  createRole,
};
