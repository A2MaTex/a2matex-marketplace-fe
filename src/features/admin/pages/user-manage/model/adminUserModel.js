const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const USER_STATUSES = new Set(["ACTIVE", "INACTIVE", "BANNED"]);
const MUTABLE_USER_STATUSES = new Set(["ACTIVE", "BANNED"]);
const ROLE_FILTERS = new Set(["CUSTOMER", "PUBLISHER", "ADMIN"]);
const PUBLISHER_STATUSES = new Set(["ACTIVE", "BLOCKED"]);

export const ADMIN_USER_PAGE_SIZE = 10;
export const ADMIN_USER_SEARCH_MAX_LENGTH = 255;

export class AdminUserContractError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "AdminUserContractError";
    this.field = field;
  }
}

const object = (value, label) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminUserContractError(`${label} must be an object.`);
  }
  return value;
};

const string = (value, label) => {
  if (typeof value !== "string") {
    throw new AdminUserContractError(`${label} must be a string.`);
  }
  return value;
};

const nullableString = (value, label) =>
  value === null || value === undefined ? null : string(value, label);

const uuid = (value, label) => {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new AdminUserContractError(`${label} must be a UUID.`);
  }
  return value;
};

const integer = (value, label, minimum = 0) => {
  if (!Number.isInteger(value) || value < minimum) {
    throw new AdminUserContractError(
      `${label} must be an integer greater than or equal to ${minimum}.`,
    );
  }
  return value;
};

const isoDate = (value, label) => {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new AdminUserContractError(`${label} must be an ISO date.`);
  }
  return value;
};

const nullableIsoDate = (value, label) =>
  value === null || value === undefined ? null : isoDate(value, label);

const enumValue = (value, values, label) => {
  if (!values.has(value)) {
    throw new AdminUserContractError(`${label} is unsupported.`);
  }
  return value;
};

const parseRoleName = (value, label) => {
  const role = string(value, label).trim();
  if (!role) throw new AdminUserContractError(`${label} cannot be empty.`);
  return role;
};

const toDateBoundary = (value, { endOfDay = false } = {}) => {
  if (!value) return undefined;
  if (!DATE_INPUT_PATTERN.test(value)) {
    throw new AdminUserContractError("Choose a valid date.", "createdFrom");
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new AdminUserContractError("Choose a valid date.", "createdFrom");
  }
  return date.toISOString();
};

const positivePage = (value) => {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
};

const allowedOrEmpty = (value, allowed) =>
  typeof value === "string" && allowed.has(value) ? value : "";

export const readAdminUserFilters = (searchParams) => ({
  q: (searchParams.get("q") ?? "").slice(0, ADMIN_USER_SEARCH_MAX_LENGTH),
  status: allowedOrEmpty(searchParams.get("status"), USER_STATUSES),
  role: allowedOrEmpty(searchParams.get("role"), ROLE_FILTERS),
  publisherStatus: allowedOrEmpty(
    searchParams.get("publisherStatus"),
    PUBLISHER_STATUSES,
  ),
  createdFrom: DATE_INPUT_PATTERN.test(searchParams.get("createdFrom") ?? "")
    ? searchParams.get("createdFrom")
    : "",
  createdTo: DATE_INPUT_PATTERN.test(searchParams.get("createdTo") ?? "")
    ? searchParams.get("createdTo")
    : "",
  page: positivePage(searchParams.get("page")),
});

export const buildAdminUserQuery = (filters) => {
  const q = filters.q?.trim() ?? "";
  if (q.length > ADMIN_USER_SEARCH_MAX_LENGTH) {
    throw new AdminUserContractError(
      `Search must be ${ADMIN_USER_SEARCH_MAX_LENGTH} characters or fewer.`,
      "q",
    );
  }

  const createdFrom = toDateBoundary(filters.createdFrom);
  let createdTo;
  try {
    createdTo = toDateBoundary(filters.createdTo, { endOfDay: true });
  } catch (error) {
    if (error instanceof AdminUserContractError) error.field = "createdTo";
    throw error;
  }
  if (createdFrom && createdTo && Date.parse(createdFrom) > Date.parse(createdTo)) {
    throw new AdminUserContractError(
      "Created from must be earlier than or equal to created to.",
      "createdFrom",
    );
  }

  return {
    ...(q ? { q } : {}),
    ...(USER_STATUSES.has(filters.status) ? { status: filters.status } : {}),
    ...(ROLE_FILTERS.has(filters.role) ? { role: filters.role } : {}),
    ...(PUBLISHER_STATUSES.has(filters.publisherStatus)
      ? { publisherStatus: filters.publisherStatus }
      : {}),
    ...(createdFrom ? { createdFrom } : {}),
    ...(createdTo ? { createdTo } : {}),
    page: positivePage(filters.page),
    pageSize: ADMIN_USER_PAGE_SIZE,
  };
};

export const filtersToSearchParams = (filters) => {
  const params = new URLSearchParams();
  const q = filters.q?.trim();
  if (q) params.set("q", q);
  if (USER_STATUSES.has(filters.status)) params.set("status", filters.status);
  if (ROLE_FILTERS.has(filters.role)) params.set("role", filters.role);
  if (PUBLISHER_STATUSES.has(filters.publisherStatus)) {
    params.set("publisherStatus", filters.publisherStatus);
  }
  if (DATE_INPUT_PATTERN.test(filters.createdFrom ?? "")) {
    params.set("createdFrom", filters.createdFrom);
  }
  if (DATE_INPUT_PATTERN.test(filters.createdTo ?? "")) {
    params.set("createdTo", filters.createdTo);
  }
  if (positivePage(filters.page) > 1) params.set("page", String(filters.page));
  return params;
};

const parseListItem = (value, label) => {
  const item = object(value, label);
  return {
    id: uuid(item.id, `${label}.id`),
    username: string(item.username, `${label}.username`),
    email: string(item.email, `${label}.email`),
    status: enumValue(item.status, USER_STATUSES, `${label}.status`),
    createdAt: isoDate(item.createdAt, `${label}.createdAt`),
    displayName: nullableString(item.displayName, `${label}.displayName`),
    roles: Array.isArray(item.roles)
      ? item.roles.map((role, index) =>
          parseRoleName(role, `${label}.roles[${index}]`),
        )
      : (() => {
          throw new AdminUserContractError(`${label}.roles must be an array.`);
        })(),
    publisherStatus:
      item.publisherStatus === null || item.publisherStatus === undefined
        ? null
        : enumValue(
            item.publisherStatus,
            PUBLISHER_STATUSES,
            `${label}.publisherStatus`,
          ),
  };
};

const envelopeData = (payload, label) => {
  const envelope = object(payload, `${label} envelope`);
  return object(envelope.data, `${label}.data`);
};

export const parseAdminUserPageEnvelope = (payload) => {
  const data = envelopeData(payload, "adminUsers");
  if (!Array.isArray(data.items)) {
    throw new AdminUserContractError("adminUsers.data.items must be an array.");
  }
  return {
    items: data.items.map((item, index) =>
      parseListItem(item, `adminUsers.data.items[${index}]`),
    ),
    totalItems: integer(data.totalItems, "adminUsers.data.totalItems"),
    page: integer(data.page, "adminUsers.data.page", 1),
    pageSize: integer(data.pageSize, "adminUsers.data.pageSize", 1),
    totalPages: integer(data.totalPages, "adminUsers.data.totalPages"),
  };
};

const parseProfile = (value) => {
  if (value === null || value === undefined) return null;
  const profile = object(value, "adminUser.data.profile");
  return {
    id: uuid(profile.id, "adminUser.data.profile.id"),
    fullName: string(profile.fullName, "adminUser.data.profile.fullName"),
    avatarStaticId: nullableString(
      profile.avatarStaticId,
      "adminUser.data.profile.avatarStaticId",
    ),
    bio: nullableString(profile.bio, "adminUser.data.profile.bio"),
    website: nullableString(profile.website, "adminUser.data.profile.website"),
    twitter: nullableString(profile.twitter, "adminUser.data.profile.twitter"),
    linkedin: nullableString(profile.linkedin, "adminUser.data.profile.linkedin"),
    github: nullableString(profile.github, "adminUser.data.profile.github"),
    instagram: nullableString(profile.instagram, "adminUser.data.profile.instagram"),
    gender: nullableString(profile.gender, "adminUser.data.profile.gender"),
    birthday: nullableIsoDate(profile.birthday, "adminUser.data.profile.birthday"),
    address: nullableString(profile.address, "adminUser.data.profile.address"),
    phone: nullableString(profile.phone, "adminUser.data.profile.phone"),
    email: nullableString(profile.email, "adminUser.data.profile.email"),
  };
};

const parsePublisher = (value) => {
  if (value === null || value === undefined) return null;
  const publisher = object(value, "adminUser.data.publisher");
  return {
    id: uuid(publisher.id, "adminUser.data.publisher.id"),
    status: enumValue(
      publisher.status,
      PUBLISHER_STATUSES,
      "adminUser.data.publisher.status",
    ),
    activatedAt: isoDate(
      publisher.activatedAt,
      "adminUser.data.publisher.activatedAt",
    ),
    blockedReason: nullableString(
      publisher.blockedReason,
      "adminUser.data.publisher.blockedReason",
    ),
    blockedAt: nullableIsoDate(
      publisher.blockedAt,
      "adminUser.data.publisher.blockedAt",
    ),
  };
};

const parseEntitlements = (value) => {
  if (value === null || value === undefined) return null;
  const summary = object(value, "adminUser.data.entitlements");
  return {
    total: integer(summary.total, "adminUser.data.entitlements.total"),
    active: integer(summary.active, "adminUser.data.entitlements.active"),
    expired: integer(summary.expired, "adminUser.data.entitlements.expired"),
    revoked: integer(summary.revoked, "adminUser.data.entitlements.revoked"),
  };
};

export const parseAdminUserDetailEnvelope = (payload) => {
  const data = envelopeData(payload, "adminUser");
  const identity = object(data.identity, "adminUser.data.identity");
  if (!Array.isArray(data.roles) || !Array.isArray(data.auditHistory)) {
    throw new AdminUserContractError(
      "adminUser.data roles and auditHistory must be arrays.",
    );
  }
  return {
    identity: {
      id: uuid(identity.id, "adminUser.data.identity.id"),
      username: string(identity.username, "adminUser.data.identity.username"),
      email: string(identity.email, "adminUser.data.identity.email"),
      status: enumValue(
        identity.status,
        USER_STATUSES,
        "adminUser.data.identity.status",
      ),
      createdAt: isoDate(
        identity.createdAt,
        "adminUser.data.identity.createdAt",
      ),
      updatedAt: nullableIsoDate(
        identity.updatedAt,
        "adminUser.data.identity.updatedAt",
      ),
    },
    profile: parseProfile(data.profile),
    roles: data.roles.map((value, index) => {
      const role = object(value, `adminUser.data.roles[${index}]`);
      return {
        id: uuid(role.id, `adminUser.data.roles[${index}].id`),
        name: parseRoleName(role.name, `adminUser.data.roles[${index}].name`),
      };
    }),
    publisher: parsePublisher(data.publisher),
    entitlements: parseEntitlements(data.entitlements),
    auditHistory: data.auditHistory,
  };
};

export const buildAdminUserStatusRequest = ({ status, reason }) => {
  if (!MUTABLE_USER_STATUSES.has(status)) {
    throw new AdminUserContractError("Choose a supported user status.", "status");
  }
  const normalizedReason = reason?.trim() ?? "";
  if (!normalizedReason) {
    throw new AdminUserContractError("A reason is required.", "reason");
  }
  return { status, reason: normalizedReason };
};

export const isProtectedAdmin = (roles = []) =>
  roles.some((role) => (typeof role === "string" ? role : role?.name) === "ADMIN");
