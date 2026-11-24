import axiosInstance from "@/lib/axios";

const customerUrl = (customerId) =>
  `/admin/users/${encodeURIComponent(customerId)}`;
const productUrl = (productId) =>
  `/products/${encodeURIComponent(productId)}`;

const customer = (customerId, { signal } = {}) =>
  axiosInstance.get(customerUrl(customerId), { signal });

const product = (productId, { signal } = {}) =>
  axiosInstance.get(productUrl(productId), { signal });

export const adminEntitlementReferenceApi = { customer, product };
