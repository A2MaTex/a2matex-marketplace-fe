export const SUBMISSION_STATUSES = [
  "PENDING_SCAN",
  "READY_FOR_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
];

const STATUS_SET = new Set(SUBMISSION_STATUSES);
const MEDIA_TYPES = new Set(["ICON", "COVER", "GALLERY"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class SubmissionContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "SubmissionContractError";
  }
}

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const object = (value, label) => {
  if (!isObject(value)) {
    throw new SubmissionContractError(`${label} must be an object.`);
  }
  return value;
};

const string = (value, label, { nullable = false, empty = false } = {}) => {
  if (nullable && (value === null || value === undefined)) return null;
  if (typeof value !== "string" || (!empty && value.length === 0)) {
    throw new SubmissionContractError(`${label} must be a string.`);
  }
  return value;
};

const uuid = (value, label, { nullable = false } = {}) => {
  const parsed = string(value, label, { nullable });
  if (parsed === null) return null;
  if (!UUID_PATTERN.test(parsed)) {
    throw new SubmissionContractError(`${label} must be a UUID.`);
  }
  return parsed;
};

const integer = (value, label, { minimum = 0 } = {}) => {
  if (!Number.isInteger(value) || value < minimum) {
    throw new SubmissionContractError(`${label} must be an integer >= ${minimum}.`);
  }
  return value;
};

const date = (value, label, { nullable = false } = {}) => {
  const parsed = string(value, label, { nullable });
  if (parsed === null) return null;
  if (Number.isNaN(Date.parse(parsed))) {
    throw new SubmissionContractError(`${label} must be an ISO date.`);
  }
  return parsed;
};

const status = (value, label) => {
  const parsed = string(value, label);
  if (!STATUS_SET.has(parsed)) {
    throw new SubmissionContractError(`${label} is unsupported.`);
  }
  return parsed;
};

const envelopeData = (payload, label) =>
  object(object(payload, `${label} envelope`).data, `${label}.data`);

const parseMedia = (value, label) => {
  const media = object(value, label);
  const type = string(media.type, `${label}.type`);
  if (!MEDIA_TYPES.has(type)) {
    throw new SubmissionContractError(`${label}.type is unsupported.`);
  }
  return {
    id: uuid(media.id, `${label}.id`),
    staticId: uuid(media.staticId, `${label}.staticId`),
    type,
    sortOrder: integer(media.sortOrder, `${label}.sortOrder`),
    altText: string(media.altText, `${label}.altText`, { nullable: true, empty: true }),
  };
};

const parseProductSnapshot = (value, label) => {
  const snapshot = object(value, label);
  if (!Array.isArray(snapshot.media)) {
    throw new SubmissionContractError(`${label}.media must be an array.`);
  }
  return {
    schemaVersion: integer(snapshot.schemaVersion, `${label}.schemaVersion`, {
      minimum: 1,
    }),
    productId: uuid(snapshot.productId, `${label}.productId`),
    publisherAccountId: uuid(
      snapshot.publisherAccountId,
      `${label}.publisherAccountId`,
    ),
    projectId: uuid(snapshot.projectId, `${label}.projectId`),
    name: string(snapshot.name, `${label}.name`),
    slug: string(snapshot.slug, `${label}.slug`),
    shortDescription: string(
      snapshot.shortDescription,
      `${label}.shortDescription`,
    ),
    description: string(snapshot.description, `${label}.description`),
    usageInstructions: string(
      snapshot.usageInstructions,
      `${label}.usageInstructions`,
      { nullable: true, empty: true },
    ),
    media: snapshot.media.map((item, index) =>
      parseMedia(item, `${label}.media[${index}]`),
    ),
  };
};

const parseReleaseRequest = (value, label) => {
  const release = object(value, label);
  return {
    schemaVersion: integer(release.schemaVersion, `${label}.schemaVersion`, {
      minimum: 1,
    }),
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
  if (!Array.isArray(context.knownLimitations)) {
    throw new SubmissionContractError(`${label}.knownLimitations must be an array.`);
  }
  return {
    schemaVersion: integer(context.schemaVersion, `${label}.schemaVersion`, {
      minimum: 1,
    }),
    purpose: string(context.purpose, `${label}.purpose`),
    testInstructions: string(
      context.testInstructions,
      `${label}.testInstructions`,
    ),
    knownLimitations: context.knownLimitations.map((item, index) =>
      string(item, `${label}.knownLimitations[${index}]`),
    ),
  };
};

const parseReviewFeedback = (value, label) => {
  if (value === null || value === undefined) return null;
  const feedback = object(value, label);
  if (feedback.items !== undefined && !Array.isArray(feedback.items)) {
    throw new SubmissionContractError(`${label}.items must be an array.`);
  }
  return {
    summary: string(feedback.summary, `${label}.summary`),
    items: (feedback.items ?? []).map((item, index) => {
      const parsed = object(item, `${label}.items[${index}]`);
      return {
        message: string(parsed.message, `${label}.items[${index}].message`),
        nodeId:
          parsed.nodeId === undefined
            ? null
            : string(parsed.nodeId, `${label}.items[${index}].nodeId`),
      };
    }),
  };
};

const jsonObject = (value, label) => object(value, label);

const parseWorkflowRevision = (value, label) => {
  const revision = object(value, label);
  return {
    id: uuid(revision.id, `${label}.id`),
    projectId: uuid(revision.projectId, `${label}.projectId`),
    sourceDraftVersion: integer(
      revision.sourceDraftVersion,
      `${label}.sourceDraftVersion`,
      { minimum: 1 },
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
    createdAt: date(revision.createdAt, `${label}.createdAt`),
  };
};

export const parseSubmissionListItem = (value, label = "submission") => {
  const submission = object(value, label);
  const product = object(submission.product, `${label}.product`);
  return {
    id: uuid(submission.id, `${label}.id`),
    productId: uuid(submission.productId, `${label}.productId`),
    workflowRevisionId: uuid(
      submission.workflowRevisionId,
      `${label}.workflowRevisionId`,
    ),
    number: integer(submission.number, `${label}.number`, { minimum: 1 }),
    status: status(submission.status, `${label}.status`),
    product: {
      name: string(product.name, `${label}.product.name`),
      slug: string(product.slug, `${label}.product.slug`),
      iconStaticId: uuid(product.iconStaticId, `${label}.product.iconStaticId`, {
        nullable: true,
      }),
    },
    requestedVersion: string(
      submission.requestedVersion,
      `${label}.requestedVersion`,
    ),
    createdAt: date(submission.createdAt, `${label}.createdAt`),
    updatedAt: date(submission.updatedAt, `${label}.updatedAt`, { nullable: true }),
    createdById: uuid(submission.createdById, `${label}.createdById`),
  };
};

export const parseSubmissionPageEnvelope = (payload) => {
  const data = envelopeData(payload, "submissions");
  if (!Array.isArray(data.items)) {
    throw new SubmissionContractError("submissions.data.items must be an array.");
  }
  return {
    items: data.items.map((item, index) =>
      parseSubmissionListItem(item, `submissions.data.items[${index}]`),
    ),
    totalItems: integer(data.totalItems, "submissions.data.totalItems"),
    page: integer(data.page, "submissions.data.page", { minimum: 1 }),
    limit: integer(data.limit, "submissions.data.limit", { minimum: 1 }),
    totalPages: integer(data.totalPages, "submissions.data.totalPages"),
  };
};

export const parseSubmissionDetail = (value, label = "submission") => {
  const submission = object(value, label);
  return {
    id: uuid(submission.id, `${label}.id`),
    productId: uuid(submission.productId, `${label}.productId`),
    workflowRevisionId: uuid(
      submission.workflowRevisionId,
      `${label}.workflowRevisionId`,
    ),
    number: integer(submission.number, `${label}.number`, { minimum: 1 }),
    status: status(submission.status, `${label}.status`),
    productSnapshot: parseProductSnapshot(
      submission.productSnapshot,
      `${label}.productSnapshot`,
    ),
    releaseRequest: parseReleaseRequest(
      submission.releaseRequest,
      `${label}.releaseRequest`,
    ),
    reviewContext: parseReviewContext(
      submission.reviewContext,
      `${label}.reviewContext`,
    ),
    reviewedAt: date(submission.reviewedAt, `${label}.reviewedAt`, {
      nullable: true,
    }),
    reviewFeedback: parseReviewFeedback(
      submission.reviewFeedback,
      `${label}.reviewFeedback`,
    ),
    workflowRevision: parseWorkflowRevision(
      submission.workflowRevision,
      `${label}.workflowRevision`,
    ),
    createdAt: date(submission.createdAt, `${label}.createdAt`),
    createdById: uuid(submission.createdById, `${label}.createdById`),
    updatedAt: date(submission.updatedAt, `${label}.updatedAt`, { nullable: true }),
  };
};

export const parseSubmissionDetailEnvelope = (payload) =>
  parseSubmissionDetail(envelopeData(payload, "submission"));

export const parseCreatedSubmissionId = (payload) =>
  uuid(envelopeData(payload, "createSubmission").id, "createSubmission.data.id");
