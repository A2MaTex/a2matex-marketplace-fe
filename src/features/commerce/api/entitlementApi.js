import axios from "@/lib/axios";
import { getMyEntitlementsUrl } from "./entitlementUrl";

const getMine = ({ page = 1, limit = 10, signal } = {}) =>
  axios.get(getMyEntitlementsUrl, { params: { page, limit }, signal });

export const entitlementApi = { getMine };
