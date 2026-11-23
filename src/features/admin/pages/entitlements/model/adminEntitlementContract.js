import {
  CommerceContractError,
  isCommerceUuid,
} from "../../../../commerce/model/commerceContract.js";

const STATUS_VALUES = new Set(["ACTIVE", "EXPIRED", "REVOKED"]);
const GRANT_SOURCE_VALUES = new Set(["ORDER", "ADMIN_GRANT"]);

const object = (value, label) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new CommerceContractError(`${label} must be an object.`);
  }
  return value;
};

const uuid = (value, label) => {
  if (!isCommerceUuid(value)) {
    throw new CommerceContractError(`${label} must be a UUID.`);
  }
  return value;
};

const nullableUuid = (value, label) =>
  value === null || value === undefined ? null : uuid(value, label);

const isoDate = (value, label) => {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new CommerceContractError(`${label} must be an ISO date.`);
  }
  return value;
};

const nullableIsoDate = (value, label) =>
  value === null || value === undefined ? null : isoDate(value, label);

const requiredNullableIsoDate = (record, key, label) => {
  if (!Object.prototype.hasOwnProperty.call(record, key)) {
    throw new CommerceContractError(`${label} is required and may be null.`);
  }
  return record[key] === null ? null : isoDate(record[key], label);
};

const nullableString = (value, label) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new CommerceContractError(`${label} must be a string or null.`);
  }
  return value;
};

const enumValue = (value, values, label) => {
  if (!values.has(value)) {
    throw new CommerceContractError(`${label} is unsupported.`);
  }
  return value;
};

const integer = (value, label, minimum = 0) => {
  if (!Number.isInteger(value) || value < minimum) {
    throw new CommerceContractError(
      `${label} must be an integer greater than or equal to ${minimum}.`,
    );
  }
  return value;
};

const jsonValue = (value, label) => {
  try {
    JSON.stringify(value);
  } catch {
    throw new CommerceContractError(`${label} must be JSON serializable.`);
  }
  return value;
};

const parseAdminEntitlement = (value, label) => {
  const item = object(value, label);
  if (!Array.isArray(item.auditHistory)) {
    throw new CommerceContractError(`${label}.auditHistory must be an array.`);
  }

  return {
    id: uuid(item.id, `${label}.id`),
    customerId: uuid(item.customerId, `${label}.customerId`),
    productId: uuid(item.productId, `${label}.productId`),
    latestProductOfferId: nullableUuid(
      item.latestProductOfferId,
      `${label}.latestProductOfferId`,
    ),
    latestOrderId: nullableUuid(
      item.latestOrderId,
      `${label}.latestOrderId`,
    ),
    status: enumValue(item.status, STATUS_VALUES, `${label}.status`),
    storedStatus: enumValue(
      item.storedStatus,
      STATUS_VALUES,
      `${label}.storedStatus`,
    ),
    grantSource: enumValue(
      item.grantSource,
      GRANT_SOURCE_VALUES,
      `${label}.grantSource`,
    ),
    startsAt: isoDate(item.startsAt, `${label}.startsAt`),
    expiresAt: requiredNullableIsoDate(item, "expiresAt", `${label}.expiresAt`),
    grantedById: nullableUuid(item.grantedById, `${label}.grantedById`),
    revokedAt: nullableIsoDate(item.revokedAt, `${label}.revokedAt`),
    revokedById: nullableUuid(item.revokedById, `${label}.revokedById`),
    revokedReason: nullableString(
      item.revokedReason,
      `${label}.revokedReason`,
    ),
    createdAt: isoDate(item.createdAt, `${label}.createdAt`),
    updatedAt: nullableIsoDate(item.updatedAt, `${label}.updatedAt`),
    auditHistory: item.auditHistory.map((entry, index) =>
      jsonValue(entry, `${label}.auditHistory[${index}]`),
    ),
  };
};

export const parseAdminEntitlementPageEnvelope = (payload) => {
  const envelope = object(payload, "adminEntitlements envelope");
  const data = object(envelope.data, "adminEntitlements.data");
  if (!Array.isArray(data.items)) {
    throw new CommerceContractError(
      "adminEntitlements.data.items must be an array.",
    );
  }

  return {
    items: data.items.map((item, index) =>
      parseAdminEntitlement(item, `adminEntitlements.data.items[${index}]`),
    ),
    totalItems: integer(
      data.totalItems,
      "adminEntitlements.data.totalItems",
    ),
    page: integer(data.page, "adminEntitlements.data.page", 1),
    pageSize: integer(data.pageSize, "adminEntitlements.data.pageSize", 1),
    totalPages: integer(
      data.totalPages,
      "adminEntitlements.data.totalPages",
    ),
  };
};

export const ADMIN_ENTITLEMENT_STATUSES = [...STATUS_VALUES];
