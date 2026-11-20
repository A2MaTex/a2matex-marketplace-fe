const RELEASE_STATUSES = new Set([
  "BUILDING",
  "PUBLISHED",
  "BUILD_FAILED",
  "DISABLED",
]);

export class ReleaseContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReleaseContractError";
  }
}

const object = (value, label) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ReleaseContractError(`${label} must be an object.`);
  }
  return value;
};

const string = (value, label, { nullable = false } = {}) => {
  if (nullable && (value === null || value === undefined)) return null;
  if (typeof value !== "string") {
    throw new ReleaseContractError(`${label} must be a string${nullable ? " or null" : ""}.`);
  }
  return value;
};

const uuid = (value, label) => {
  const parsed = string(value, label);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed)) {
    throw new ReleaseContractError(`${label} must be a UUID.`);
  }
  return parsed;
};

const date = (value, label, { nullable = false } = {}) => {
  const parsed = string(value, label, { nullable });
  if (parsed === null) return null;
  if (Number.isNaN(Date.parse(parsed))) {
    throw new ReleaseContractError(`${label} must be an ISO date.`);
  }
  return parsed;
};

const integer = (value, label, minimum = 0) => {
  if (!Number.isInteger(value) || value < minimum) {
    throw new ReleaseContractError(`${label} must be an integer >= ${minimum}.`);
  }
  return value;
};

const envelopeData = (payload, label) =>
  object(object(payload, `${label} envelope`).data, `${label}.data`);

const parseSummary = (value, label = "release") => {
  const release = object(value, label);
  const status = string(release.status, `${label}.status`);
  if (!RELEASE_STATUSES.has(status)) {
    throw new ReleaseContractError(`${label}.status is not supported.`);
  }
  if (typeof release.isCurrent !== "boolean") {
    throw new ReleaseContractError(`${label}.isCurrent must be a boolean.`);
  }
  return {
    id: uuid(release.id, `${label}.id`),
    productId: uuid(release.productId, `${label}.productId`),
    submissionId: uuid(release.submissionId, `${label}.submissionId`),
    version: string(release.version, `${label}.version`),
    status,
    changelog: string(release.changelog, `${label}.changelog`),
    minimumLauncherVersion: string(
      release.minimumLauncherVersion,
      `${label}.minimumLauncherVersion`,
    ),
    minimumRuntimeVersion: string(
      release.minimumRuntimeVersion,
      `${label}.minimumRuntimeVersion`,
    ),
    publishedAt: date(release.publishedAt, `${label}.publishedAt`, { nullable: true }),
    createdAt: date(release.createdAt, `${label}.createdAt`),
    isCurrent: release.isCurrent,
  };
};

export const parseReleasePageEnvelope = (payload) => {
  const data = envelopeData(payload, "releases");
  if (!Array.isArray(data.items)) {
    throw new ReleaseContractError("releases.data.items must be an array.");
  }
  return {
    items: data.items.map((item, index) =>
      parseSummary(item, `releases.data.items[${index}]`),
    ),
    page: integer(data.page, "releases.data.page", 1),
    limit: integer(data.limit, "releases.data.limit", 1),
    totalItems: integer(data.totalItems, "releases.data.totalItems"),
    totalPages: integer(data.totalPages, "releases.data.totalPages"),
  };
};

export const parseReleaseDetailEnvelope = (payload) => {
  const release = envelopeData(payload, "release");
  const summary = parseSummary(release, "release.data");
  if (!Array.isArray(release.requiredCapabilities)) {
    throw new ReleaseContractError("release.data.requiredCapabilities must be an array.");
  }
  release.requiredCapabilities.forEach((item, index) =>
    string(item, `release.data.requiredCapabilities[${index}]`),
  );
  return {
    ...summary,
    workflowRevisionId: uuid(
      release.workflowRevisionId,
      "release.data.workflowRevisionId",
    ),
    packageSizeBytes: string(
      release.packageSizeBytes,
      "release.data.packageSizeBytes",
      { nullable: true },
    ),
    packageHash: string(release.packageHash, "release.data.packageHash", {
      nullable: true,
    }),
    requiredCapabilities: [...release.requiredCapabilities],
    inputSchema: object(release.inputSchema, "release.data.inputSchema"),
    disabledAt: date(release.disabledAt, "release.data.disabledAt", {
      nullable: true,
    }),
    disabledReason: string(
      release.disabledReason,
      "release.data.disabledReason",
      { nullable: true },
    ),
    downloadUrl: string(release.downloadUrl, "release.data.downloadUrl", {
      nullable: true,
    }),
  };
};

export const PRODUCT_RELEASE_STATUSES = [...RELEASE_STATUSES];
