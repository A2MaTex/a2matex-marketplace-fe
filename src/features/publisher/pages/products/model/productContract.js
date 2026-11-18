const PRODUCT_STATUSES = new Set(["DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED"]);
const MEDIA_TYPES = new Set(["ICON", "COVER", "GALLERY"]);

export class ProductContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProductContractError";
  }
}

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const requireObject = (value, label) => {
  if (!isObject(value)) throw new ProductContractError(`${label} must be an object.`);
  return value;
};

const requireString = (value, label) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new ProductContractError(`${label} must be a non-empty string.`);
  }
  return value;
};

const optionalString = (value, label) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new ProductContractError(`${label} must be a string or null.`);
  }
  return value;
};

const requireInteger = (value, label, { minimum = 0 } = {}) => {
  if (!Number.isInteger(value) || value < minimum) {
    throw new ProductContractError(`${label} must be an integer >= ${minimum}.`);
  }
  return value;
};

const envelopeData = (payload, label) => {
  const envelope = requireObject(payload, `${label} envelope`);
  return requireObject(envelope.data, `${label}.data`);
};

const parseProjectReference = (value, fallbackId, label) => {
  if (value === null || value === undefined) {
    return fallbackId ? { id: requireString(fallbackId, `${label}.id`), name: null } : null;
  }
  const project = requireObject(value, label);
  return {
    id: requireString(project.id, `${label}.id`),
    name: optionalString(project.name, `${label}.name`),
    status: optionalString(project.status, `${label}.status`),
  };
};

export const parseProductMedia = (value, label = "media") => {
  const media = requireObject(value, label);
  const type = requireString(media.type, `${label}.type`);
  if (!MEDIA_TYPES.has(type)) {
    throw new ProductContractError(`${label}.type is not supported.`);
  }
  return {
    id: optionalString(media.id, `${label}.id`),
    staticId: requireString(media.staticId, `${label}.staticId`),
    type,
    sortOrder: requireInteger(media.sortOrder, `${label}.sortOrder`),
    altText: optionalString(media.altText, `${label}.altText`),
  };
};

export const parseProduct = (value, label = "product") => {
  const product = requireObject(value, label);
  const status = requireString(product.status, `${label}.status`);
  if (!PRODUCT_STATUSES.has(status)) {
    throw new ProductContractError(`${label}.status is not supported.`);
  }
  if (product.media !== undefined && product.media !== null && !Array.isArray(product.media)) {
    throw new ProductContractError(`${label}.media must be an array.`);
  }

  return {
    id: requireString(product.id, `${label}.id`),
    project: parseProjectReference(product.project, product.projectId, `${label}.project`),
    name: optionalString(product.name, `${label}.name`),
    slug: optionalString(product.slug, `${label}.slug`),
    shortDescription: optionalString(
      product.shortDescription,
      `${label}.shortDescription`,
    ),
    description: optionalString(product.description, `${label}.description`),
    usageInstructions: optionalString(
      product.usageInstructions,
      `${label}.usageInstructions`,
    ),
    status,
    statusReason: optionalString(product.statusReason, `${label}.statusReason`),
    suspendedAt: optionalString(product.suspendedAt, `${label}.suspendedAt`),
    currentReleaseId: optionalString(
      product.currentReleaseId,
      `${label}.currentReleaseId`,
    ),
    media: (product.media ?? []).map((item, index) =>
      parseProductMedia(item, `${label}.media[${index}]`),
    ),
    createdAt: optionalString(product.createdAt, `${label}.createdAt`),
    updatedAt: optionalString(product.updatedAt, `${label}.updatedAt`),
  };
};

export const parseProductPageEnvelope = (payload) => {
  const data = envelopeData(payload, "products");
  if (!Array.isArray(data.items)) {
    throw new ProductContractError("products.data.items must be an array.");
  }
  return {
    items: data.items.map((item, index) =>
      parseProduct(item, `products.data.items[${index}]`),
    ),
    page: requireInteger(data.page, "products.data.page", { minimum: 1 }),
    limit: requireInteger(data.limit, "products.data.limit", { minimum: 1 }),
    totalItems: requireInteger(data.totalItems, "products.data.totalItems"),
    totalPages: requireInteger(data.totalPages, "products.data.totalPages"),
  };
};

export const parseProductEnvelope = (payload) =>
  parseProduct(envelopeData(payload, "product"));

export const parseCreatedProductId = (payload) =>
  requireString(envelopeData(payload, "createProduct").id, "createProduct.data.id");

export const PRODUCT_STATUS_VALUES = [...PRODUCT_STATUSES];
