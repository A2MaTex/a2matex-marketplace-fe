import axios from "@/lib/axios";
import {
  adminEntitlementsUrl,
  grantAdminEntitlementUrl,
  revokeAdminEntitlementUrl,
} from "./adminEntitlementUrl";

const list = ({ params, signal } = {}) =>
  axios.get(adminEntitlementsUrl, { params, signal });

const grant = (input, { signal } = {}) =>
  axios.post(grantAdminEntitlementUrl, input, { signal });

const revoke = (entitlementId, input, { signal } = {}) =>
  axios.post(revokeAdminEntitlementUrl(entitlementId), input, { signal });

export const adminEntitlementApi = { list, grant, revoke };
