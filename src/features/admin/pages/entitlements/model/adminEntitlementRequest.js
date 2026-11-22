import { isCommerceUuid } from "../../../../commerce/model/commerceContract.js";

const REASON_MAX_LENGTH = 2000;

export class AdminEntitlementInputError extends Error {
  constructor(field, message) {
    super(message);
    this.name = "AdminEntitlementInputError";
    this.field = field;
  }
}

const positiveInteger = (value, field) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new AdminEntitlementInputError(field, `${field} must be positive.`);
  }
  return number;
};

const requiredUuid = (value, field) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!isCommerceUuid(normalized)) {
    throw new AdminEntitlementInputError(field, "Enter a valid UUID.");
  }
  return normalized;
};

const requiredReason = (value) => {
  const reason = typeof value === "string" ? value.trim() : "";
  if (!reason) {
    throw new AdminEntitlementInputError("reason", "Reason is required.");
  }
  if (reason.length > REASON_MAX_LENGTH) {
    throw new AdminEntitlementInputError(
      "reason",
      `Reason must be ${REASON_MAX_LENGTH} characters or fewer.`,
    );
  }
  return reason;
};

export const buildAdminEntitlementQuery = ({
  page = 1,
  limit = 20,
  customerId,
  productId,
} = {}) => {
  const query = {
    page: positiveInteger(page, "page"),
    limit: positiveInteger(limit, "limit"),
  };

  const normalizedCustomerId = customerId?.trim();
  const normalizedProductId = productId?.trim();
  if (normalizedCustomerId) {
    query.customerId = requiredUuid(normalizedCustomerId, "customerId");
  }
  if (normalizedProductId) {
    query.productId = requiredUuid(normalizedProductId, "productId");
  }
  return query;
};

export const buildGrantEntitlementRequest = (
  { customerId, productId, lifetime, expiresAt, reason },
  { now = Date.now() } = {},
) => {
  let normalizedExpiresAt = null;
  if (!lifetime) {
    const instant = new Date(expiresAt);
    if (!expiresAt || Number.isNaN(instant.getTime())) {
      throw new AdminEntitlementInputError(
        "expiresAt",
        "Choose a valid expiry date and time.",
      );
    }
    if (instant.getTime() <= now) {
      throw new AdminEntitlementInputError(
        "expiresAt",
        "Expiry must be in the future.",
      );
    }
    normalizedExpiresAt = instant.toISOString();
  }

  return {
    customerId: requiredUuid(customerId, "customerId"),
    productId: requiredUuid(productId, "productId"),
    expiresAt: normalizedExpiresAt,
    reason: requiredReason(reason),
  };
};

export const buildRevokeEntitlementRequest = ({ reason }) => ({
  reason: requiredReason(reason),
});

export const ADMIN_ENTITLEMENT_REASON_MAX_LENGTH = REASON_MAX_LENGTH;
