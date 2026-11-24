const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PUBLISHER_STATUSES = new Set(["ACTIVE", "BLOCKED"]);
const USER_STATUSES = new Set(["ACTIVE", "INACTIVE", "BANNED"]);
const ROLE_STATUSES = new Set(["ACTIVE", "INACTIVE"]);
const TERM_TYPES = new Set([
  "PUBLISHER_TERMS",
  "CUSTOMER_TERMS",
  "PRIVACY_POLICY",
]);

export const ADMIN_PUBLISHER_PAGE_SIZE = 10;
export const ADMIN_PUBLISHER_REASON_MAX_LENGTH = 2000;

export class AdminPublisherContractError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "AdminPublisherContractError";
    this.field = field;
  }
}

const object = (value, label) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminPublisherContractError(`${label} must be an object.`);
  }
  return value;
};

const string = (value, label) => {
  if (typeof value !== "string") {
    throw new AdminPublisherContractError(`${label} must be a string.`);
  }
  return value;
};

const nonEmptyString = (value, label) => {
  const parsed = string(value, label).trim();
  if (!parsed) {
    throw new AdminPublisherContractError(`${label} cannot be empty.`);
  }
  return parsed;
};

const nullableString = (value, label) =>
  value === null || value === undefined ? null : string(value, label);

const uuid = (value, label) => {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new AdminPublisherContractError(`${label} must be a UUID.`);
  }
  return value;
};

const nullableUuid = (value, label) =>
  value === null || value === undefined ? null : uuid(value, label);

const integer = (value, label, minimum = 0) => {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new AdminPublisherContractError(
      `${label} must be a safe integer greater than or equal to ${minimum}.`,
    );
  }
  return value;
};

const isoDate = (value, label) => {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new AdminPublisherContractError(`${label} must be an ISO date.`);
  }
  return value;
};

const nullableIsoDate = (value, label) =>
  value === null || value === undefined ? null : isoDate(value, label);

const enumValue = (value, allowed, label) => {
  if (!allowed.has(value)) {
    throw new AdminPublisherContractError(`${label} is unsupported.`);
  }
  return value;
};

const positiveInteger = (value, fallback, maximum = Number.MAX_SAFE_INTEGER) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= maximum
    ? parsed
    : fallback;
};

const envelopeData = (payload, label) => {
  const envelope = object(payload, `${label} envelope`);
  return object(envelope.data, `${label}.data`);
};

const parseUser = (value, label) => {
  const user = object(value, label);
  return {
    id: uuid(user.id, `${label}.id`),
    username: nonEmptyString(user.username, `${label}.username`),
    status: enumValue(user.status, USER_STATUSES, `${label}.status`),
  };
};

const parseListProfile = (value, label) => {
  if (value === null || value === undefined) return null;
  const profile = object(value, label);
  return {
    fullName: nonEmptyString(profile.fullName, `${label}.fullName`),
    email: nullableString(profile.email, `${label}.email`),
  };
};

const parseDetailProfile = (value, label) => {
  if (value === null || value === undefined) return null;
  const profile = object(value, label);
  return {
    id: uuid(profile.id, `${label}.id`),
    fullName: nonEmptyString(profile.fullName, `${label}.fullName`),
    avatarStaticId: nullableUuid(profile.avatarStaticId, `${label}.avatarStaticId`),
    bio: nullableString(profile.bio, `${label}.bio`),
    website: nullableString(profile.website, `${label}.website`),
    twitter: nullableString(profile.twitter, `${label}.twitter`),
    linkedin: nullableString(profile.linkedin, `${label}.linkedin`),
    github: nullableString(profile.github, `${label}.github`),
    instagram: nullableString(profile.instagram, `${label}.instagram`),
    gender: nullableString(profile.gender, `${label}.gender`),
    birthday: nullableIsoDate(profile.birthday, `${label}.birthday`),
    address: nullableString(profile.address, `${label}.address`),
    phone: nullableString(profile.phone, `${label}.phone`),
    email: nullableString(profile.email, `${label}.email`),
    createdAt: isoDate(profile.createdAt, `${label}.createdAt`),
  };
};

const parsePublisher = (value, label, profileParser) => {
  const publisher = object(value, label);
  return {
    id: uuid(publisher.id, `${label}.id`),
    status: enumValue(
      publisher.status,
      PUBLISHER_STATUSES,
      `${label}.status`,
    ),
    activatedAt: isoDate(publisher.activatedAt, `${label}.activatedAt`),
    blockedReason: nullableString(
      publisher.blockedReason,
      `${label}.blockedReason`,
    ),
    blockedAt: nullableIsoDate(publisher.blockedAt, `${label}.blockedAt`),
    user: parseUser(publisher.user, `${label}.user`),
    profile: profileParser(publisher.profile, `${label}.profile`),
  };
};

export const readAdminPublisherFilters = (searchParams) => ({
  status: PUBLISHER_STATUSES.has(searchParams.get("status"))
    ? searchParams.get("status")
    : "",
  page: positiveInteger(searchParams.get("page"), 1),
  pageSize: positiveInteger(
    searchParams.get("pageSize"),
    ADMIN_PUBLISHER_PAGE_SIZE,
    100,
  ),
});

export const buildAdminPublisherQuery = (filters) => ({
  ...(PUBLISHER_STATUSES.has(filters.status)
    ? { status: filters.status }
    : {}),
  page: positiveInteger(filters.page, 1),
  pageSize: positiveInteger(filters.pageSize, ADMIN_PUBLISHER_PAGE_SIZE, 100),
});

export const publisherFiltersToSearchParams = (filters) => {
  const params = new URLSearchParams();
  if (PUBLISHER_STATUSES.has(filters.status)) {
    params.set("status", filters.status);
  }
  const page = positiveInteger(filters.page, 1);
  const pageSize = positiveInteger(
    filters.pageSize,
    ADMIN_PUBLISHER_PAGE_SIZE,
    100,
  );
  if (page > 1) params.set("page", String(page));
  if (pageSize !== ADMIN_PUBLISHER_PAGE_SIZE) {
    params.set("pageSize", String(pageSize));
  }
  return params;
};

export const parseAdminPublisherPageEnvelope = (payload) => {
  const data = envelopeData(payload, "adminPublishers");
  if (!Array.isArray(data.items)) {
    throw new AdminPublisherContractError(
      "adminPublishers.data.items must be an array.",
    );
  }
  return {
    items: data.items.map((item, index) =>
      parsePublisher(
        item,
        `adminPublishers.data.items[${index}]`,
        parseListProfile,
      ),
    ),
    totalItems: integer(data.totalItems, "adminPublishers.data.totalItems"),
    page: integer(data.page, "adminPublishers.data.page", 1),
    pageSize: integer(data.pageSize, "adminPublishers.data.pageSize", 1),
    totalPages: integer(data.totalPages, "adminPublishers.data.totalPages"),
  };
};

export const parseAdminPublisherDetailEnvelope = (payload) => {
  const data = envelopeData(payload, "adminPublisher");
  const detail = parsePublisher(data, "adminPublisher.data", parseDetailProfile);
  if (!Array.isArray(data.roles) || !Array.isArray(data.acceptedTerms)) {
    throw new AdminPublisherContractError(
      "adminPublisher.data roles and acceptedTerms must be arrays.",
    );
  }
  if (typeof data.acceptedCurrentTerms !== "boolean") {
    throw new AdminPublisherContractError(
      "adminPublisher.data.acceptedCurrentTerms must be a boolean.",
    );
  }
  return {
    ...detail,
    blockedById: nullableUuid(
      data.blockedById,
      "adminPublisher.data.blockedById",
    ),
    acceptedCurrentTerms: data.acceptedCurrentTerms,
    roles: data.roles.map((value, index) => {
      const label = `adminPublisher.data.roles[${index}]`;
      const role = object(value, label);
      return {
        id: uuid(role.id, `${label}.id`),
        name: nonEmptyString(role.name, `${label}.name`),
        status: enumValue(role.status, ROLE_STATUSES, `${label}.status`),
      };
    }),
    acceptedTerms: data.acceptedTerms.map((value, index) => {
      const label = `adminPublisher.data.acceptedTerms[${index}]`;
      const term = object(value, label);
      return {
        id: uuid(term.id, `${label}.id`),
        type: enumValue(term.type, TERM_TYPES, `${label}.type`),
        version: nonEmptyString(term.version, `${label}.version`),
        title: nonEmptyString(term.title, `${label}.title`),
        acceptedAt: isoDate(term.acceptedAt, `${label}.acceptedAt`),
      };
    }),
  };
};

export const buildAdminPublisherStatusRequest = ({
  currentStatus,
  nextStatus,
  reason,
}) => {
  if (!PUBLISHER_STATUSES.has(currentStatus)) {
    throw new AdminPublisherContractError(
      "The current Publisher status is unsupported.",
      "status",
    );
  }
  const expectedNext = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
  if (nextStatus !== expectedNext) {
    throw new AdminPublisherContractError(
      "The Publisher status transition is unsupported.",
      "status",
    );
  }
  if (nextStatus === "ACTIVE") {
    return { status: "ACTIVE", expectedStatus: currentStatus };
  }
  const normalizedReason = reason?.trim() ?? "";
  if (!normalizedReason) {
    throw new AdminPublisherContractError("A reason is required.", "reason");
  }
  if (normalizedReason.length > ADMIN_PUBLISHER_REASON_MAX_LENGTH) {
    throw new AdminPublisherContractError(
      `Reason must be ${ADMIN_PUBLISHER_REASON_MAX_LENGTH} characters or fewer.`,
      "reason",
    );
  }
  return {
    status: "BLOCKED",
    expectedStatus: currentStatus,
    reason: normalizedReason,
  };
};

export const ADMIN_PUBLISHER_STATUSES = [...PUBLISHER_STATUSES];
