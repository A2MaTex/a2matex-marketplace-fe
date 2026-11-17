const PROJECT_STATUSES = new Set(["ACTIVE", "ARCHIVED"]);

export class PublisherContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "PublisherContractError";
  }
}

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const requireObject = (value, label) => {
  if (!isObject(value)) {
    throw new PublisherContractError(`${label} must be an object.`);
  }
  return value;
};

const requireString = (value, label) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new PublisherContractError(`${label} must be a non-empty string.`);
  }
  return value;
};

const requirePositiveInteger = (value, label, { allowZero = false } = {}) => {
  const minimum = allowZero ? 0 : 1;
  if (!Number.isInteger(value) || value < minimum) {
    throw new PublisherContractError(`${label} must be an integer greater than or equal to ${minimum}.`);
  }
  return value;
};

const envelopeData = (payload, label) => {
  const envelope = requireObject(payload, `${label} envelope`);
  return requireObject(envelope.data, `${label}.data`);
};

export const parseProject = (value, label = "project") => {
  const project = requireObject(value, label);
  const status = requireString(project.status, `${label}.status`);
  if (!PROJECT_STATUSES.has(status)) {
    throw new PublisherContractError(`${label}.status is not supported.`);
  }

  return {
    id: requireString(project.id, `${label}.id`),
    publisherAccountId: requireString(
      project.publisherAccountId,
      `${label}.publisherAccountId`,
    ),
    name: requireString(project.name, `${label}.name`),
    description:
      project.description === null || project.description === undefined
        ? null
        : String(project.description),
    status,
    createdAt: requireString(project.createdAt, `${label}.createdAt`),
    updatedAt:
      project.updatedAt === null || project.updatedAt === undefined
        ? null
        : requireString(project.updatedAt, `${label}.updatedAt`),
  };
};

export const parseProjectPageEnvelope = (payload) => {
  const data = envelopeData(payload, "projects");
  if (!Array.isArray(data.items)) {
    throw new PublisherContractError("projects.data.items must be an array.");
  }

  const page = requirePositiveInteger(data.page, "projects.data.page");
  const limit = requirePositiveInteger(data.limit, "projects.data.limit");
  const totalItems = requirePositiveInteger(
    data.totalItems,
    "projects.data.totalItems",
    { allowZero: true },
  );
  const totalPages = requirePositiveInteger(
    data.totalPages,
    "projects.data.totalPages",
    { allowZero: true },
  );

  return {
    items: data.items.map((project, index) =>
      parseProject(project, `projects.data.items[${index}]`),
    ),
    page,
    limit,
    totalItems,
    totalPages,
  };
};

export const parseProjectEnvelope = (payload) =>
  parseProject(envelopeData(payload, "project"));

const parseDraft = (value) => {
  const draft = requireObject(value, "projectDraft.data.draft");
  return {
    id: requireString(draft.id, "projectDraft.data.draft.id"),
    projectId: requireString(draft.projectId, "projectDraft.data.draft.projectId"),
    version: requirePositiveInteger(draft.version, "projectDraft.data.draft.version"),
    editorGraph: requireObject(
      draft.editorGraph,
      "projectDraft.data.draft.editorGraph",
    ),
    inputSchema: requireObject(
      draft.inputSchema,
      "projectDraft.data.draft.inputSchema",
    ),
    runtimeIr:
      draft.runtimeIr === null
        ? null
        : requireObject(draft.runtimeIr, "projectDraft.data.draft.runtimeIr"),
    validationSummary: requireObject(
      draft.validationSummary,
      "projectDraft.data.draft.validationSummary",
    ),
    contentHash: requireString(
      draft.contentHash,
      "projectDraft.data.draft.contentHash",
    ),
    savedAt: requireString(draft.savedAt, "projectDraft.data.draft.savedAt"),
  };
};

export const parseProjectDraftEnvelope = (payload) => {
  const data = envelopeData(payload, "projectDraft");
  const projectStatus = requireString(
    data.projectStatus,
    "projectDraft.data.projectStatus",
  );
  if (!PROJECT_STATUSES.has(projectStatus)) {
    throw new PublisherContractError(
      "projectDraft.data.projectStatus is not supported.",
    );
  }

  return {
    projectStatus,
    draft: data.draft === null ? null : parseDraft(data.draft),
  };
};

export const getGraphSummary = (draft) => {
  const graph = draft?.editorGraph;
  if (!isObject(graph)) {
    return { schemaVersion: null, nodeCount: 0, edgeCount: 0 };
  }

  if (isObject(graph.workflows)) {
    const workflows = Object.values(graph.workflows).filter(isObject);
    return {
      schemaVersion: graph.schemaVersion ?? null,
      nodeCount: workflows.reduce(
        (total, workflow) => total + (Array.isArray(workflow.nodes) ? workflow.nodes.length : 0),
        0,
      ),
      edgeCount: workflows.reduce(
        (total, workflow) => total + (Array.isArray(workflow.edges) ? workflow.edges.length : 0),
        0,
      ),
    };
  }

  return {
    schemaVersion: graph.schemaVersion ?? null,
    nodeCount: Array.isArray(graph.nodes) ? graph.nodes.length : 0,
    edgeCount: Array.isArray(graph.edges) ? graph.edges.length : 0,
  };
};
