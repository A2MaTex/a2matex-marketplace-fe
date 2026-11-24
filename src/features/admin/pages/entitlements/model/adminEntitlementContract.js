import {
  CommerceContractError,
  isCommerceUuid,
} from "../../../../commerce/model/commerceContract.js";

const EFFECTIVE_STATUS_VALUES = new Set(["ACTIVE", "EXPIRED", "REVOKED"]);
const STORED_STATUS_VALUES = new Set(["ACTIVE", "REVOKED"]);
const GRANT_SOURCE_VALUES = new Set(["ORDER", "ADMIN_GRANT"]);
const AUDIT_ACTION_VALUES = new Set(["GRANT", "REVOKE"]);

const own = (record, key) => Object.prototype.hasOwnProperty.call(record, key);

const object = (value, label) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new CommerceContractError(`${label} must be an object.`);
  }
  return value;
};

const string = (value, label) => {
  if (typeof value !== "string") {
    throw new CommerceContractError(`${label} must be a string.`);
  }
  return value;
};

const uuid = (value, label) => {
  if (!isCommerceUuid(value)) {
    throw new CommerceContractError(`${label} must be a UUID.`);
  }
  return value;
};

const isoDate = (value, label) => {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new CommerceContractError(`${label} must be an ISO date.`);
  }
  return value;
};

const requiredNullable = (record, key, label, parser) => {
  if (!own(record, key)) {
    throw new CommerceContractError(`${label} is required and may be null.`);
  }
  return record[key] === null ? null : parser(record[key], label);
};

const optionalNullable = (record, key, label, parser) => {
  if (!own(record, key) || record[key] === null) return null;
  return parser(record[key], label);
};

const enumValue = (value, values, label) => {
  if (!values.has(value)) {
    throw new CommerceContractError(`${label} is unsupported.`);
  }
  return value;
};

const integer = (value, label, minimum = 0) => {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new CommerceContractError(
      `${label} must be a safe integer greater than or equal to ${minimum}.`,
    );
  }
  return value;
};

const parseSnapshot = (value, label) => {
  const snapshot = object(value, label);
  return {
    status: enumValue(snapshot.status, STORED_STATUS_VALUES, `${label}.status`),
    grantSource: enumValue(
      snapshot.grantSource,
      GRANT_SOURCE_VALUES,
      `${label}.grantSource`,
    ),
    startsAt: isoDate(snapshot.startsAt, `${label}.startsAt`),
    expiresAt: requiredNullable(
      snapshot,
      "expiresAt",
      `${label}.expiresAt`,
      isoDate,
    ),
    revokedAt: optionalNullable(
      snapshot,
      "revokedAt",
      `${label}.revokedAt`,
      isoDate,
    ),
    revokedById: optionalNullable(
      snapshot,
      "revokedById",
      `${label}.revokedById`,
      uuid,
    ),
    revokedReason: optionalNullable(
      snapshot,
      "revokedReason",
      `${label}.revokedReason`,
      string,
    ),
  };
};

const parseAuditEntry = (value, label) => {
  const entry = object(value, label);
  if (!own(entry, "before")) {
    throw new CommerceContractError(`${label}.before is required and may be null.`);
  }
  return {
    action: enumValue(entry.action, AUDIT_ACTION_VALUES, `${label}.action`),
    reason: string(entry.reason, `${label}.reason`),
    actedAt: isoDate(entry.actedAt, `${label}.actedAt`),
    actedById: uuid(entry.actedById, `${label}.actedById`),
    before:
      entry.before === null
        ? null
        : parseSnapshot(entry.before, `${label}.before`),
    after: parseSnapshot(entry.after, `${label}.after`),
  };
};

export const parseAdminEntitlement = (value, label = "adminEntitlement") => {
  const item = object(value, label);
  if (!Array.isArray(item.auditHistory)) {
    throw new CommerceContractError(`${label}.auditHistory must be an array.`);
  }

  return {
    id: uuid(item.id, `${label}.id`),
    customerId: uuid(item.customerId, `${label}.customerId`),
    productId: uuid(item.productId, `${label}.productId`),
    status: enumValue(item.status, EFFECTIVE_STATUS_VALUES, `${label}.status`),
    storedStatus: enumValue(
      item.storedStatus,
      STORED_STATUS_VALUES,
      `${label}.storedStatus`,
    ),
    grantSource: enumValue(
      item.grantSource,
      GRANT_SOURCE_VALUES,
      `${label}.grantSource`,
    ),
    grantedById: requiredNullable(
      item,
      "grantedById",
      `${label}.grantedById`,
      uuid,
    ),
    startsAt: isoDate(item.startsAt, `${label}.startsAt`),
    expiresAt: requiredNullable(
      item,
      "expiresAt",
      `${label}.expiresAt`,
      isoDate,
    ),
    latestProductOfferId: requiredNullable(
      item,
      "latestProductOfferId",
      `${label}.latestProductOfferId`,
      uuid,
    ),
    latestOrderId: requiredNullable(
      item,
      "latestOrderId",
      `${label}.latestOrderId`,
      uuid,
    ),
    oneTimePurchasedAt: requiredNullable(
      item,
      "oneTimePurchasedAt",
      `${label}.oneTimePurchasedAt`,
      isoDate,
    ),
    revokedAt: requiredNullable(
      item,
      "revokedAt",
      `${label}.revokedAt`,
      isoDate,
    ),
    revokedById: requiredNullable(
      item,
      "revokedById",
      `${label}.revokedById`,
      uuid,
    ),
    revokedReason: requiredNullable(
      item,
      "revokedReason",
      `${label}.revokedReason`,
      string,
    ),
    auditHistory: item.auditHistory.map((entry, index) =>
      parseAuditEntry(entry, `${label}.auditHistory[${index}]`),
    ),
    createdAt: isoDate(item.createdAt, `${label}.createdAt`),
    updatedAt: requiredNullable(
      item,
      "updatedAt",
      `${label}.updatedAt`,
      isoDate,
    ),
  };
};

export const parseAdminEntitlementEnvelope = (payload) => {
  const envelope = object(payload, "adminEntitlement envelope");
  return parseAdminEntitlement(envelope.data, "adminEntitlement.data");
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
    totalItems: integer(data.totalItems, "adminEntitlements.data.totalItems"),
    page: integer(data.page, "adminEntitlements.data.page", 1),
    pageSize: integer(data.pageSize, "adminEntitlements.data.pageSize", 1),
    totalPages: integer(data.totalPages, "adminEntitlements.data.totalPages"),
  };
};

export const ADMIN_ENTITLEMENT_EFFECTIVE_STATUSES = [
  ...EFFECTIVE_STATUS_VALUES,
];
export const ADMIN_ENTITLEMENT_STORED_STATUSES = [...STORED_STATUS_VALUES];
