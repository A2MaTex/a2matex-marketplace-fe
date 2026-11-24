import { parseAdminUserDetailEnvelope } from "../../user-manage/model/adminUserModel.js";
import { parseProductEnvelope } from "../../../../publisher/pages/products/model/productContract.js";

const normalized = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export const toEntitlementCustomerReference = (detail) => {
  const fullName = normalized(detail.profile?.fullName);
  const username = normalized(detail.identity.username);
  const email = normalized(detail.identity.email);

  return {
    id: detail.identity.id,
    name: fullName ?? username ?? email,
    secondary: fullName && username ? `@${username}` : email,
    status: "ready",
  };
};

export const toEntitlementProductReference = (product) => {
  const name = normalized(product.name);
  const slug = normalized(product.slug);

  return {
    id: product.id,
    name: name ?? slug,
    secondary: name && slug ? slug : null,
    status: "ready",
  };
};

export const parseEntitlementCustomerReference = (payload) =>
  toEntitlementCustomerReference(parseAdminUserDetailEnvelope(payload));

export const parseEntitlementProductReference = (payload) =>
  toEntitlementProductReference(parseProductEnvelope(payload));
