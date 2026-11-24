const SUBMISSION_STATUSES = new Set([
  "PENDING_SCAN",
  "READY_FOR_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
]);
const SCAN_STATUSES = new Set(["QUEUED", "RUNNING", "PASSED", "FAILED", "ERROR"]);
const MEDIA_TYPES = new Set(["ICON", "COVER", "GALLERY"]);
const FINDING_SEVERITIES = new Set(["INFO", "WARNING", "ERROR"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SNAPSHOT_SCHEMA_VERSION = 1;

export class AdminSubmissionContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "AdminSubmissionContractError";
  }
}

const own = (record, key) => Object.prototype.hasOwnProperty.call(record, key);

const object = (value, label) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminSubmissionContractError(`${label} must be an object.`);
  }
  return value;
};

const array = (value, label) => {
  if (!Array.isArray(value)) {
    throw new AdminSubmissionContractError(`${label} must be an array.`);
  }
  return value;
};

const string = (value, label, { empty = false } = {}) => {
  if (typeof value !== "string" || (!empty && value.length === 0)) {
    throw new AdminSubmissionContractError(`${label} must be a string.`);
  }
  return value;
};

const requiredNullableString = (record, key, label, options) => {
  if (!own(record, key)) {
    throw new AdminSubmissionContractError(`${label} is required and may be null.`);
  }
  return record[key] === null ? null : string(record[key], label, options);
};

const uuid = (value, label) => {
  const parsed = string(value, label);
  if (!UUID_PATTERN.test(parsed)) {
    throw new AdminSubmissionContractError(`${label} must be a UUID.`);
  }
  return parsed;
};

const requiredNullableUuid = (record, key, label) => {
  if (!own(record, key)) {
    throw new AdminSubmissionContractError(`${label} is required and may be null.`);
  }
  return record[key] === null ? null : uuid(record[key], label);
};

const integer = (value, label, minimum = 0) => {
  if (!Number.isInteger(value) || value < minimum) {
    throw new AdminSubmissionContractError(
      `${label} must be an integer greater than or equal to ${minimum}.`,
    );
  }
  return value;
};

const boolean = (value, label) => {
  if (typeof value !== "boolean") {
    throw new AdminSubmissionContractError(`${label} must be a boolean.`);
  }
  return value;
};

const isoDate = (value, label) => {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new AdminSubmissionContractError(`${label} must be an ISO date.`);
  }
  return value;
};

const nullableIsoDate = (value, label) =>
  value === null ? null : isoDate(value, label);

const enumValue = (value, allowed, label) => {
  if (!allowed.has(value)) {
    throw new AdminSubmissionContractError(`${label} is unsupported.`);
  }
  return value;
};

const schemaVersion = (value, label) => {
  if (value !== SNAPSHOT_SCHEMA_VERSION) {
    throw new AdminSubmissionContractError(
      `${label} uses unsupported schema version ${String(value)}.`,
    );
  }
  return value;
};

const jsonObject = (value, label) => {
  const parsed = object(value, label);
  try {
    JSON.stringify(parsed);
  } catch {
    throw new AdminSubmissionContractError(`${label} must be JSON serializable.`);
  }
  return parsed;
};

const envelopeData = (payload, label) =>
  object(object(payload, `${label} envelope`).data, `${label}.data`);

const parseScanSummary = (value, label) => {
  const summary = object(value, label);
  return {
    totalRules: integer(summary.totalRules, `${label}.totalRules`),
    passed: integer(summary.passed, `${label}.passed`),
    warnings: integer(summary.warnings, `${label}.warnings`),
    errors: integer(summary.errors, `${label}.errors`),
    truncated: boolean(summary.truncated, `${label}.truncated`),
  };
};

const requiredNullableScanSummary = (record, key, label) => {
  if (!own(record, key)) {
    throw new AdminSubmissionContractError(`${label} is required and may be null.`);
  }
  return record[key] === null ? null : parseScanSummary(record[key], label);
};

const parseListItem = (value, label) => {
  const item = object(value, label);
  const product = object(item.product, `${label}.product`);
  if (!own(item, "scanAttempt") || !own(item, "scanStatus")) {
    throw new AdminSubmissionContractError(
      `${label} is missing the required Admin scanner projection.`,
    );
  }
  return {
    id: uuid(item.id, `${label}.id`),
    productId: uuid(item.productId, `${label}.productId`),
    workflowRevisionId: uuid(item.workflowRevisionId, `${label}.workflowRevisionId`),
    number: integer(item.number, `${label}.number`, 1),
    status: enumValue(item.status, SUBMISSION_STATUSES, `${label}.status`),
    product: {
      name: string(product.name, `${label}.product.name`),
      slug: string(product.slug, `${label}.product.slug`),
      iconStaticId:
        product.iconStaticId === null
          ? null
          : uuid(product.iconStaticId, `${label}.product.iconStaticId`),
    },
    requestedVersion: string(item.requestedVersion, `${label}.requestedVersion`),
    createdAt: isoDate(item.createdAt, `${label}.createdAt`),
    updatedAt: nullableIsoDate(item.updatedAt, `${label}.updatedAt`),
    createdById: uuid(item.createdById, `${label}.createdById`),
    scanAttempt: integer(item.scanAttempt, `${label}.scanAttempt`, 1),
    scanStatus: enumValue(item.scanStatus, SCAN_STATUSES, `${label}.scanStatus`),
    scannerVersion: requiredNullableString(
      item,
      "scannerVersion",
      `${label}.scannerVersion`,
      { empty: true },
    ),
    scanSummary: requiredNullableScanSummary(item, "scanSummary", `${label}.scanSummary`),
  };
};

const parseMedia = (value, label) => {
  const media = object(value, label);
  return {
    id: uuid(media.id, `${label}.id`),
    staticId: uuid(media.staticId, `${label}.staticId`),
    type: enumValue(media.type, MEDIA_TYPES, `${label}.type`),
    sortOrder: integer(media.sortOrder, `${label}.sortOrder`),
    altText: media.altText === null ? null : string(media.altText, `${label}.altText`, { empty: true }),
  };
};

const parseProductSnapshot = (value, label) => {
  const snapshot = object(value, label);
  return {
    schemaVersion: schemaVersion(snapshot.schemaVersion, `${label}.schemaVersion`),
    productId: uuid(snapshot.productId, `${label}.productId`),
    publisherAccountId: uuid(snapshot.publisherAccountId, `${label}.publisherAccountId`),
    projectId: uuid(snapshot.projectId, `${label}.projectId`),
    name: string(snapshot.name, `${label}.name`),
    slug: string(snapshot.slug, `${label}.slug`),
    shortDescription: string(snapshot.shortDescription, `${label}.shortDescription`),
    description: string(snapshot.description, `${label}.description`),
    usageInstructions:
      snapshot.usageInstructions === null
        ? null
        : string(snapshot.usageInstructions, `${label}.usageInstructions`, { empty: true }),
    media: array(snapshot.media, `${label}.media`).map((item, index) =>
      parseMedia(item, `${label}.media[${index}]`),
    ),
  };
};

const parseReleaseRequest = (value, label) => {
  const release = object(value, label);
  return {
    schemaVersion: schemaVersion(release.schemaVersion, `${label}.schemaVersion`),
    version: string(release.version, `${label}.version`),
    changelog: string(release.changelog, `${label}.changelog`),
    minimumLauncherVersion: string(
      release.minimumLauncherVersion,
      `${label}.minimumLauncherVersion`,
    ),
    minimumRuntimeVersion: string(
      release.minimumRuntimeVersion,
      `${label}.minimumRuntimeVersion`,
    ),
  };
};

const parseReviewContext = (value, label) => {
  const context = object(value, label);
  return {
    schemaVersion: schemaVersion(context.schemaVersion, `${label}.schemaVersion`),
    purpose: string(context.purpose, `${label}.purpose`),
    testInstructions: string(context.testInstructions, `${label}.testInstructions`),
    knownLimitations: array(context.knownLimitations, `${label}.knownLimitations`).map(
      (item, index) => string(item, `${label}.knownLimitations[${index}]`),
    ),
  };
};

const parseReviewFeedback = (value, label) => {
  if (value === null) return null;
  const feedback = object(value, label);
  return {
    summary: string(feedback.summary, `${label}.summary`),
    items: own(feedback, "items")
      ? array(feedback.items, `${label}.items`).map((valueItem, index) => {
          const item = object(valueItem, `${label}.items[${index}]`);
          return {
            message: string(item.message, `${label}.items[${index}].message`),
            nodeId: own(item, "nodeId")
              ? string(item.nodeId, `${label}.items[${index}].nodeId`)
              : null,
          };
        })
      : [],
  };
};

const parseWorkflowRevision = (value, label) => {
  const revision = object(value, label);
  return {
    id: uuid(revision.id, `${label}.id`),
    projectId: uuid(revision.projectId, `${label}.projectId`),
    sourceDraftVersion: integer(
      revision.sourceDraftVersion,
      `${label}.sourceDraftVersion`,
      1,
    ),
    sourceDraftContentHash: string(
      revision.sourceDraftContentHash,
      `${label}.sourceDraftContentHash`,
    ),
    contentHash: string(revision.contentHash, `${label}.contentHash`),
    editorGraph: jsonObject(revision.editorGraph, `${label}.editorGraph`),
    runtimeIr: jsonObject(revision.runtimeIr, `${label}.runtimeIr`),
    inputSchema: jsonObject(revision.inputSchema, `${label}.inputSchema`),
    nodeDefinitionManifest: jsonObject(
      revision.nodeDefinitionManifest,
      `${label}.nodeDefinitionManifest`,
    ),
    capabilityManifest: jsonObject(
      revision.capabilityManifest,
      `${label}.capabilityManifest`,
    ),
    validationSummary: jsonObject(
      revision.validationSummary,
      `${label}.validationSummary`,
    ),
    createdAt: isoDate(revision.createdAt, `${label}.createdAt`),
  };
};

const parseFinding = (value, label) => {
  const finding = object(value, label);
  return {
    code: string(finding.code, `${label}.code`),
    severity: enumValue(finding.severity, FINDING_SEVERITIES, `${label}.severity`),
    message: string(finding.message, `${label}.message`),
    nodeId: own(finding, "nodeId") ? string(finding.nodeId, `${label}.nodeId`) : null,
    details: own(finding, "details")
      ? jsonObject(finding.details, `${label}.details`)
      : null,
  };
};

const parseScanResult = (value, label) => {
  const result = object(value, label);
  return {
    schemaVersion: schemaVersion(result.schemaVersion, `${label}.schemaVersion`),
    summary: parseScanSummary(result.summary, `${label}.summary`),
    findings: array(result.findings, `${label}.findings`).map((finding, index) =>
      parseFinding(finding, `${label}.findings[${index}]`),
    ),
  };
};

const parseDetail = (value, label) => {
  const detail = object(value, label);
  if (!own(detail, "scanAttempt") || !own(detail, "scanStatus") || !own(detail, "scanResult")) {
    throw new AdminSubmissionContractError(
      `${label} is missing the required Admin scanner projection.`,
    );
  }
  return {
    id: uuid(detail.id, `${label}.id`),
    productId: uuid(detail.productId, `${label}.productId`),
    workflowRevisionId: uuid(detail.workflowRevisionId, `${label}.workflowRevisionId`),
    number: integer(detail.number, `${label}.number`, 1),
    status: enumValue(detail.status, SUBMISSION_STATUSES, `${label}.status`),
    productSnapshot: parseProductSnapshot(detail.productSnapshot, `${label}.productSnapshot`),
    releaseRequest: parseReleaseRequest(detail.releaseRequest, `${label}.releaseRequest`),
    reviewContext: parseReviewContext(detail.reviewContext, `${label}.reviewContext`),
    reviewedAt: nullableIsoDate(detail.reviewedAt, `${label}.reviewedAt`),
    reviewFeedback: parseReviewFeedback(detail.reviewFeedback, `${label}.reviewFeedback`),
    workflowRevision: parseWorkflowRevision(
      detail.workflowRevision,
      `${label}.workflowRevision`,
    ),
    createdAt: isoDate(detail.createdAt, `${label}.createdAt`),
    createdById: uuid(detail.createdById, `${label}.createdById`),
    updatedAt: nullableIsoDate(detail.updatedAt, `${label}.updatedAt`),
    scanAttempt: integer(detail.scanAttempt, `${label}.scanAttempt`, 1),
    scanStatus: enumValue(detail.scanStatus, SCAN_STATUSES, `${label}.scanStatus`),
    scannerVersion: requiredNullableString(
      detail,
      "scannerVersion",
      `${label}.scannerVersion`,
      { empty: true },
    ),
    scanResult: detail.scanResult === null
      ? null
      : parseScanResult(detail.scanResult, `${label}.scanResult`),
    updatedById: requiredNullableUuid(detail, "updatedById", `${label}.updatedById`),
  };
};

export const parseAdminSubmissionPageEnvelope = (payload) => {
  const data = envelopeData(payload, "adminSubmissions");
  return {
    items: array(data.items, "adminSubmissions.data.items").map((item, index) =>
      parseListItem(item, `adminSubmissions.data.items[${index}]`),
    ),
    totalItems: integer(data.totalItems, "adminSubmissions.data.totalItems"),
    page: integer(data.page, "adminSubmissions.data.page", 1),
    limit: integer(data.limit, "adminSubmissions.data.limit", 1),
    totalPages: integer(data.totalPages, "adminSubmissions.data.totalPages"),
  };
};

export const parseAdminSubmissionDetailEnvelope = (payload) =>
  parseDetail(envelopeData(payload, "adminSubmission"), "adminSubmission.data");
