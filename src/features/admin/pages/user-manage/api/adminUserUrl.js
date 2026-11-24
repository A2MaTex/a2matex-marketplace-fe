export const adminUsersUrl = "/admin/users";

export const adminUserDetailUrl = (userId) =>
  `/admin/users/${encodeURIComponent(userId)}`;

export const adminUserStatusUrl = (userId) =>
  `/admin/users/${encodeURIComponent(userId)}/status`;
