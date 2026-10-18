// Permission
export const getPermissionsUrl = "/permissions";
export const addPermissionUrl = "/permissions";
export const editPermissionUrl = (id) => `/permissions/${id}`;
export const deletePermissionUrl = "/permissions";

// Role
export const getRolesUrl = "/roles";
export const addRoleUrl = "/roles";
export const editRoleUrl = (id) => `/roles/${id}`;
export const deleteRoleUrl = `/roles`;
export const getRoleByIdUrl = (id) => `/roles/${id}`;

// Role Permission
export const getPermissionsOfRoleUrl = (roleId) =>
  `/roles/${roleId}/permissions`;
export const saveRolePermissionsUrl = (roleId) =>
  `/roles/${roleId}/permissions`;
