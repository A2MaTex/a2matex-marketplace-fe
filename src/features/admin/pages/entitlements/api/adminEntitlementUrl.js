export const adminEntitlementsUrl = "/admin/entitlements";
export const grantAdminEntitlementUrl = `${adminEntitlementsUrl}/grant`;
export const revokeAdminEntitlementUrl = (entitlementId) =>
  `${adminEntitlementsUrl}/${entitlementId}/revoke`;
