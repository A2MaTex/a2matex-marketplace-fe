const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECIMAL_PATTERN = /^\d+$/;
const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const ORDER_STATUSES = new Set(["PAID"]);
const ENTITLEMENT_STATUSES = new Set(["ACTIVE", "EXPIRED", "REVOKED"]);
const GRANT_SOURCES = new Set(["ORDER", "ADMIN_GRANT"]);
const OFFER_TYPES = new Set(["SUBSCRIPTION", "ONE_TIME"]);

export class CommerceContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "CommerceContractError";
  }
}

const object = (value, label) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new CommerceContractError(`${label} must be an object.`);
  }
  return value;
};

const uuid = (value, label) => {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new CommerceContractError(`${label} must be a UUID.`);
  }
  return value;
};

const decimalString = (value, label) => {
  if (typeof value !== "string" || !DECIMAL_PATTERN.test(value)) {
    throw new CommerceContractError(`${label} must be a decimal string.`);
  }
  return value;
};

const isoDate = (value, label) => {
  if (
    typeof value !== "string" ||
    !ISO_DATE_PATTERN.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    throw new CommerceContractError(`${label} must be an ISO date.`);
  }
  return value;
};

const nullableIsoDate = (value, label) =>
  value === null ? null : isoDate(value, label);

const enumValue = (value, values, label) => {
  if (!values.has(value)) {
    throw new CommerceContractError(`${label} is unsupported.`);
  }
  return value;
};

const optionalUuid = (value, label) =>
  value === null || value === undefined ? null : uuid(value, label);

const optionalIsoDate = (value, label) =>
  value === null || value === undefined ? null : isoDate(value, label);

const nullableString = (value, label) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new CommerceContractError(`${label} must be a string or null.`);
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

const optionalInteger = (value, label, minimum = 0) =>
  value === null || value === undefined
    ? null
    : integer(value, label, minimum);

const envelopeData = (payload, label) => {
  const envelope = object(payload, `${label} envelope`);
  return object(envelope.data, `${label}.data`);
};

const parseOfferSnapshot = (value, label) => {
  const snapshot = object(value, label);
  const offerType = enumValue(
    snapshot.offerType,
    OFFER_TYPES,
    `${label}.offerType`,
  );
  const durationDays = snapshot.durationDays;

  if (offerType === "ONE_TIME" && durationDays !== null) {
    throw new CommerceContractError(
      `${label}.durationDays must be null for ONE_TIME.`,
    );
  }
  if (
    offerType === "SUBSCRIPTION" &&
    (!Number.isInteger(durationDays) || durationDays <= 0)
  ) {
    throw new CommerceContractError(
      `${label}.durationDays must be a positive integer for SUBSCRIPTION.`,
    );
  }

  return {
    offerType,
    durationDays,
    priceAmount: decimalString(
      snapshot.priceAmount,
      `${label}.priceAmount`,
    ),
  };
};

const parseProductSummary = (value, label) => {
  const product = object(value, label);
  return {
    id: uuid(product.id, `${label}.id`),
    name: nullableString(product.name, `${label}.name`),
    slug: nullableString(product.slug, `${label}.slug`),
  };
};

const parsePublisherSummary = (value, label) => {
  if (value === null || value === undefined) return null;
  const publisher = object(value, label);
  return {
    id: optionalUuid(publisher.id, `${label}.id`),
    username: nullableString(publisher.username, `${label}.username`),
    displayName: nullableString(
      publisher.displayName,
      `${label}.displayName`,
    ),
  };
};

const parseOrder = (value, label) => {
  const order = object(value, label);
  return {
    id: uuid(order.id, `${label}.id`),
    customerId: optionalUuid(order.customerId, `${label}.customerId`),
    productId: optionalUuid(order.productId, `${label}.productId`),
    productOfferId: optionalUuid(
      order.productOfferId,
      `${label}.productOfferId`,
    ),
    status: enumValue(order.status, ORDER_STATUSES, `${label}.status`),
    quantity: optionalInteger(order.quantity, `${label}.quantity`, 1),
    unitPriceAmount: decimalString(
      order.unitPriceAmount,
      `${label}.unitPriceAmount`,
    ),
    totalAmount: decimalString(order.totalAmount, `${label}.totalAmount`),
    offerSnapshot: parseOfferSnapshot(
      order.offerSnapshot,
      `${label}.offerSnapshot`,
    ),
    product: parseProductSummary(order.product, `${label}.product`),
    createdAt: isoDate(order.createdAt, `${label}.createdAt`),
  };
};

export const parseEntitlement = (value, label = "entitlement") => {
  const entitlement = object(value, label);
  const product =
    entitlement.product === null || entitlement.product === undefined
      ? null
      : parseProductSummary(entitlement.product, `${label}.product`);
  return {
    id: uuid(entitlement.id, `${label}.id`),
    customerId: optionalUuid(entitlement.customerId, `${label}.customerId`),
    productId: optionalUuid(entitlement.productId, `${label}.productId`),
    orderId: optionalUuid(entitlement.orderId, `${label}.orderId`),
    status: enumValue(
      entitlement.status,
      ENTITLEMENT_STATUSES,
      `${label}.status`,
    ),
    grantSource: enumValue(
      entitlement.grantSource,
      GRANT_SOURCES,
      `${label}.grantSource`,
    ),
    startsAt: isoDate(entitlement.startsAt, `${label}.startsAt`),
    expiresAt: nullableIsoDate(entitlement.expiresAt, `${label}.expiresAt`),
    createdAt: optionalIsoDate(entitlement.createdAt, `${label}.createdAt`),
    updatedAt: optionalIsoDate(entitlement.updatedAt, `${label}.updatedAt`),
    product,
    publisher: parsePublisherSummary(
      entitlement.publisher ?? entitlement.product?.publisher,
      `${label}.publisher`,
    ),
  };
};

export const parseCreatedOrderEnvelope = (payload) => {
  const order = envelopeData(payload, "createOrder");

  return {
    id: uuid(order.id, "createOrder.data.id"),
    customerId: optionalUuid(
      order.customerId,
      "createOrder.data.customerId",
    ),
    productId: optionalUuid(order.productId, "createOrder.data.productId"),
    productOfferId: optionalUuid(
      order.productOfferId,
      "createOrder.data.productOfferId",
    ),
    status: enumValue(
      order.status,
      ORDER_STATUSES,
      "createOrder.data.status",
    ),
    unitPriceAmount: decimalString(
      order.unitPriceAmount,
      "createOrder.data.unitPriceAmount",
    ),
    totalAmount: decimalString(
      order.totalAmount,
      "createOrder.data.totalAmount",
    ),
    offerSnapshot: parseOfferSnapshot(
      order.offerSnapshot,
      "createOrder.data.offerSnapshot",
    ),
    createdAt: isoDate(order.createdAt, "createOrder.data.createdAt"),
    entitlement: parseEntitlement(
      order.entitlement,
      "createOrder.data.entitlement",
    ),
  };
};

export const parseOrderPageEnvelope = (payload) => {
  const data = envelopeData(payload, "orders");
  if (!Array.isArray(data.items)) {
    throw new CommerceContractError("orders.data.items must be an array.");
  }

  return {
    items: data.items.map((item, index) =>
      parseOrder(item, `orders.data.items[${index}]`),
    ),
    totalItems: integer(data.totalItems, "orders.data.totalItems"),
    page: integer(data.page, "orders.data.page", 1),
    pageSize: integer(data.pageSize, "orders.data.pageSize", 1),
    totalPages: integer(data.totalPages, "orders.data.totalPages"),
  };
};

export const parseOrderDetailEnvelope = (payload) =>
  parseOrder(envelopeData(payload, "order"), "order.data");

export const parseEntitlementPageEnvelope = (payload) => {
  const data = envelopeData(payload, "entitlements");
  if (!Array.isArray(data.items)) {
    throw new CommerceContractError(
      "entitlements.data.items must be an array.",
    );
  }

  return {
    items: data.items.map((item, index) =>
      parseEntitlement(item, `entitlements.data.items[${index}]`),
    ),
    totalItems: integer(data.totalItems, "entitlements.data.totalItems"),
    page: integer(data.page, "entitlements.data.page", 1),
    pageSize: integer(data.pageSize, "entitlements.data.pageSize", 1),
    totalPages: integer(
      data.totalPages,
      "entitlements.data.totalPages",
    ),
  };
};

export const isCommerceUuid = (value) =>
  typeof value === "string" && UUID_PATTERN.test(value);

export const COMMERCE_UUID_PATTERN = UUID_PATTERN;
