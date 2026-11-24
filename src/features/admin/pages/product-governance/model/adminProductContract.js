const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECIMAL_PATTERN = /^\d+$/;

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED"];
export const RELEASE_STATUSES = [
  "BUILDING",
  "PUBLISHED",
  "BUILD_FAILED",
  "DISABLED",
];
export const ADMIN_PRODUCT_PAGE_SIZE = 10;
export const ADMIN_PRODUCT_REASON_MAX_LENGTH = 2000;
export const ADMIN_RELEASE_REASON_MAX_LENGTH = 2000;

const PRODUCT_STATUS_SET = new Set(PRODUCT_STATUSES);
const RELEASE_STATUS_SET = new Set(RELEASE_STATUSES);
const PROJECT_STATUS_SET = new Set(["ACTIVE", "ARCHIVED"]);
const MEDIA_TYPE_SET = new Set(["ICON", "COVER", "GALLERY"]);
const OFFER_TYPE_SET = new Set(["ONE_TIME", "SUBSCRIPTION"]);

export class AdminProductContractError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "AdminProductContractError";
    this.field = field;
  }
}

const object = (value, label) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminProductContractError(`${label} must be an object.`);
  }
  return value;
};

const string = (value, label) => {
  if (typeof value !== "string") {
    throw new AdminProductContractError(`${label} must be a string.`);
  }
  return value;
};

const nullableString = (value, label) =>
  value === null ? null : string(value, label);

const uuid = (value, label) => {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new AdminProductContractError(`${label} must be a UUID.`);
  }
  return value;
};

const nullableUuid = (value, label) =>
  value === null ? null : uuid(value, label);

const integer = (value, label, minimum = 0) => {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new AdminProductContractError(`${label} must be a valid integer.`);
  }
  return value;
};

const boolean = (value, label) => {
  if (typeof value !== "boolean") {
    throw new AdminProductContractError(`${label} must be a boolean.`);
  }
  return value;
};

const isoDate = (value, label) => {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new AdminProductContractError(`${label} must be an ISO date.`);
  }
  return value;
};

const nullableIsoDate = (value, label) =>
  value === null ? null : isoDate(value, label);

const enumValue = (value, allowed, label) => {
  if (!allowed.has(value)) {
    throw new AdminProductContractError(`${label} is unsupported.`);
  }
  return value;
};

const array = (value, label) => {
  if (!Array.isArray(value)) {
    throw new AdminProductContractError(`${label} must be an array.`);
  }
  return value;
};

const envelopeData = (payload, label) => {
  const envelope = object(payload, `${label} envelope`);
  return object(envelope.data, `${label}.data`);
};

const parseProject = (value, label) => {
  const project = object(value, label);
  return {
    id: uuid(project.id, `${label}.id`),
    name: string(project.name, `${label}.name`),
    status: enumValue(project.status, PROJECT_STATUS_SET, `${label}.status`),
  };
};

const parseMedia = (value, label) => {
  const media = object(value, label);
  return {
    id: uuid(media.id, `${label}.id`),
    staticId: uuid(media.staticId, `${label}.staticId`),
    type: enumValue(media.type, MEDIA_TYPE_SET, `${label}.type`),
    sortOrder: integer(media.sortOrder, `${label}.sortOrder`),
    altText: nullableString(media.altText, `${label}.altText`),
  };
};

const parseProduct = (value, label) => {
  const product = object(value, label);
  return {
    id: uuid(product.id, `${label}.id`),
    publisherAccountId: uuid(
      product.publisherAccountId,
      `${label}.publisherAccountId`,
    ),
    status: enumValue(product.status, PRODUCT_STATUS_SET, `${label}.status`),
    name: nullableString(product.name, `${label}.name`),
    slug: nullableString(product.slug, `${label}.slug`),
    shortDescription: nullableString(
      product.shortDescription,
      `${label}.shortDescription`,
    ),
    description: nullableString(product.description, `${label}.description`),
    usageInstructions: nullableString(
      product.usageInstructions,
      `${label}.usageInstructions`,
    ),
    currentReleaseId: nullableUuid(
      product.currentReleaseId,
      `${label}.currentReleaseId`,
    ),
    statusReason: nullableString(product.statusReason, `${label}.statusReason`),
    suspendedAt: nullableIsoDate(product.suspendedAt, `${label}.suspendedAt`),
    createdAt: isoDate(product.createdAt, `${label}.createdAt`),
    updatedAt: nullableIsoDate(product.updatedAt, `${label}.updatedAt`),
    project: parseProject(product.project, `${label}.project`),
    media: array(product.media, `${label}.media`).map((item, index) =>
      parseMedia(item, `${label}.media[${index}]`),
    ),
  };
};

const parseOffer = (value, label) => {
  const offer = object(value, label);
  if (typeof offer.priceAmount !== "string" || !DECIMAL_PATTERN.test(offer.priceAmount)) {
    throw new AdminProductContractError(`${label}.priceAmount must be a decimal string.`);
  }
  return {
    id: uuid(offer.id, `${label}.id`),
    type: enumValue(offer.type, OFFER_TYPE_SET, `${label}.type`),
    durationDays:
      offer.durationDays === null
        ? null
        : integer(offer.durationDays, `${label}.durationDays`, 1),
    priceAmount: offer.priceAmount,
  };
};

export const parseAdminProductPageEnvelope = (payload) => {
  const data = envelopeData(payload, "adminProducts");
  return {
    items: array(data.items, "adminProducts.data.items").map((item, index) =>
      parseProduct(item, `adminProducts.data.items[${index}]`),
    ),
    totalItems: integer(data.totalItems, "adminProducts.data.totalItems"),
    page: integer(data.page, "adminProducts.data.page", 1),
    limit: integer(data.limit, "adminProducts.data.limit", 1),
    totalPages: integer(data.totalPages, "adminProducts.data.totalPages"),
  };
};

export const parseAdminProductDetailEnvelope = (payload) => {
  const data = envelopeData(payload, "adminProduct");
  return {
    ...parseProduct(data, "adminProduct.data"),
    offers: array(data.offers, "adminProduct.data.offers").map((item, index) =>
      parseOffer(item, `adminProduct.data.offers[${index}]`),
    ),
  };
};

const parseRelease = (value, label) => {
  const release = object(value, label);
  return {
    id: uuid(release.id, `${label}.id`),
    productId: uuid(release.productId, `${label}.productId`),
    submissionId: uuid(release.submissionId, `${label}.submissionId`),
    version: string(release.version, `${label}.version`),
    status: enumValue(release.status, RELEASE_STATUS_SET, `${label}.status`),
    buildFailureCode: string(release.buildFailureCode, `${label}.buildFailureCode`),
    changelog: string(release.changelog, `${label}.changelog`),
    minimumLauncherVersion: string(
      release.minimumLauncherVersion,
      `${label}.minimumLauncherVersion`,
    ),
    minimumRuntimeVersion: string(
      release.minimumRuntimeVersion,
      `${label}.minimumRuntimeVersion`,
    ),
    publishedAt: nullableIsoDate(release.publishedAt, `${label}.publishedAt`),
    createdAt: isoDate(release.createdAt, `${label}.createdAt`),
    isCurrent: boolean(release.isCurrent, `${label}.isCurrent`),
  };
};

export const parseAdminProductReleasePageEnvelope = (payload, productId) => {
  const data = envelopeData(payload, "adminProductReleases");
  const items = array(data.items, "adminProductReleases.data.items").map(
    (item, index) =>
      parseRelease(item, `adminProductReleases.data.items[${index}]`),
  );
  if (items.some((item) => item.productId !== productId)) {
    throw new AdminProductContractError(
      "A release does not belong to the requested Product.",
    );
  }
  return {
    items,
    totalItems: integer(data.totalItems, "adminProductReleases.data.totalItems"),
    page: integer(data.page, "adminProductReleases.data.page", 1),
    limit: integer(data.limit, "adminProductReleases.data.limit", 1),
    totalPages: integer(data.totalPages, "adminProductReleases.data.totalPages"),
  };
};

const isPlainSerializableObject = (value) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  try {
    return JSON.parse(JSON.stringify(value)) !== undefined;
  } catch {
    return false;
  }
};

export const parseAdminProductReleaseDetailEnvelope = (payload, productId) => {
  const data = envelopeData(payload, "adminProductRelease");
  const summary = parseRelease(
    { ...data, buildFailureCode: data.buildFailureCode ?? "" },
    "adminProductRelease.data",
  );
  if (summary.productId !== productId) {
    throw new AdminProductContractError(
      "The release does not belong to the requested Product.",
    );
  }
  if (
    data.packageSizeBytes !== null &&
    (typeof data.packageSizeBytes !== "string" ||
      !DECIMAL_PATTERN.test(data.packageSizeBytes))
  ) {
    throw new AdminProductContractError(
      "adminProductRelease.data.packageSizeBytes must be a decimal string or null.",
    );
  }
  if (!isPlainSerializableObject(data.inputSchema)) {
    throw new AdminProductContractError(
      "adminProductRelease.data.inputSchema must be a JSON object.",
    );
  }
  const downloadUrl = nullableString(
    data.downloadUrl,
    "adminProductRelease.data.downloadUrl",
  );
  if (downloadUrl && !/^https?:\/\//i.test(downloadUrl)) {
    throw new AdminProductContractError(
      "adminProductRelease.data.downloadUrl must use HTTP or HTTPS.",
    );
  }
  return {
    ...summary,
    buildFailureCode:
      data.buildFailureCode === undefined || data.buildFailureCode === null
        ? null
        : string(data.buildFailureCode, "adminProductRelease.data.buildFailureCode"),
    workflowRevisionId: uuid(
      data.workflowRevisionId,
      "adminProductRelease.data.workflowRevisionId",
    ),
    packageSizeBytes: data.packageSizeBytes,
    packageHash: nullableString(data.packageHash, "adminProductRelease.data.packageHash"),
    requiredCapabilities: array(
      data.requiredCapabilities,
      "adminProductRelease.data.requiredCapabilities",
    ).map((item, index) =>
      string(item, `adminProductRelease.data.requiredCapabilities[${index}]`),
    ),
    inputSchema: data.inputSchema,
    disabledAt: nullableIsoDate(
      data.disabledAt,
      "adminProductRelease.data.disabledAt",
    ),
    disabledReason: nullableString(
      data.disabledReason,
      "adminProductRelease.data.disabledReason",
    ),
    downloadUrl,
  };
};

const positiveInteger = (value, fallback, maximum = 100) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= maximum
    ? parsed
    : fallback;
};

export const readAdminProductFilters = (searchParams) => ({
  status: PRODUCT_STATUS_SET.has(searchParams.get("status"))
    ? searchParams.get("status")
    : "",
  page: positiveInteger(searchParams.get("page"), 1),
  limit: positiveInteger(searchParams.get("limit"), ADMIN_PRODUCT_PAGE_SIZE),
});

export const productFiltersToSearchParams = ({ status, page, limit }) => {
  const params = new URLSearchParams();
  if (PRODUCT_STATUS_SET.has(status)) params.set("status", status);
  const safePage = positiveInteger(page, 1);
  const safeLimit = positiveInteger(limit, ADMIN_PRODUCT_PAGE_SIZE);
  if (safePage > 1) params.set("page", String(safePage));
  if (safeLimit !== ADMIN_PRODUCT_PAGE_SIZE) params.set("limit", String(safeLimit));
  return params;
};

export const readReleasePagination = (searchParams) => ({
  page: positiveInteger(searchParams.get("page"), 1),
  limit: positiveInteger(searchParams.get("limit"), ADMIN_PRODUCT_PAGE_SIZE),
});

export const releasePaginationToSearchParams = ({ page, limit }) => {
  const params = new URLSearchParams();
  const safePage = positiveInteger(page, 1);
  const safeLimit = positiveInteger(limit, ADMIN_PRODUCT_PAGE_SIZE);
  if (safePage > 1) params.set("page", String(safePage));
  if (safeLimit !== ADMIN_PRODUCT_PAGE_SIZE) params.set("limit", String(safeLimit));
  return params;
};

export const buildProductModerationRequest = ({ status, action, reason = "" }) => {
  if (action === "SUSPEND" && status === "ACTIVE") {
    const normalizedReason = reason.trim();
    if (!normalizedReason || normalizedReason.length > ADMIN_PRODUCT_REASON_MAX_LENGTH) {
      throw new AdminProductContractError(
        `Reason must contain 1–${ADMIN_PRODUCT_REASON_MAX_LENGTH} characters.`,
        "reason",
      );
    }
    return { action, reason: normalizedReason };
  }
  if (action === "REACTIVATE" && status === "SUSPENDED") {
    return { action };
  }
  throw new AdminProductContractError(
    "The Product status changed and this moderation action is no longer available.",
  );
};

export const buildDisableReleaseRequest = ({ reason, replacementReleaseId }) => {
  const normalizedReason = reason.trim();
  if (!normalizedReason || normalizedReason.length > ADMIN_RELEASE_REASON_MAX_LENGTH) {
    throw new AdminProductContractError(
      `Reason must contain 1–${ADMIN_RELEASE_REASON_MAX_LENGTH} characters.`,
      "reason",
    );
  }
  return {
    action: "DISABLE",
    reason: normalizedReason,
    ...(replacementReleaseId ? { replacementReleaseId: uuid(replacementReleaseId, "replacementReleaseId") } : {}),
  };
};

export const hasEligibleSubscriptionOffer = (offers) =>
  offers.some(
    (offer) =>
      offer.type === "SUBSCRIPTION" &&
      offer.durationDays !== null &&
      BigInt(offer.priceAmount) > 0n,
  );

export const hasReleasedProductEvidence = (releases) =>
  releases.some((release) =>
    release.status === "PUBLISHED" || release.status === "DISABLED",
  );

export const canSelectCurrentRelease = (product, release) =>
  product.status === "SUSPENDED" &&
  release.status === "PUBLISHED" &&
  !release.isCurrent &&
  Boolean(release.packageHash) &&
  Boolean(release.downloadUrl);
