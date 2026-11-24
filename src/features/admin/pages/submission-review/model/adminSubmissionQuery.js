export const ADMIN_SUBMISSION_PAGE_SIZE = 10;

export const ADMIN_SUBMISSION_STATUSES = [
  "PENDING_SCAN",
  "READY_FOR_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
];

const STATUS_SET = new Set(ADMIN_SUBMISSION_STATUSES);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isSubmissionUuid = (value) =>
  typeof value === "string" && UUID_PATTERN.test(value);

const positivePage = (value) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
};

export const readAdminSubmissionQuery = (searchParams) => {
  const status = searchParams.get("status") ?? "";
  const productId = searchParams.get("productId") ?? "";
  return {
    page: positivePage(searchParams.get("page")),
    limit: ADMIN_SUBMISSION_PAGE_SIZE,
    status: STATUS_SET.has(status) ? status : "",
    productId: isSubmissionUuid(productId) ? productId : "",
  };
};

export const buildAdminSubmissionSearchParams = (query) => {
  const params = new URLSearchParams();
  if (positivePage(query.page) > 1) params.set("page", String(query.page));
  if (STATUS_SET.has(query.status)) params.set("status", query.status);
  if (isSubmissionUuid(query.productId)) params.set("productId", query.productId);
  return params;
};

export const withAdminSubmissionQuery = (query, patch) => ({
  ...query,
  ...patch,
  page: Object.prototype.hasOwnProperty.call(patch, "page") ? patch.page : 1,
  limit: ADMIN_SUBMISSION_PAGE_SIZE,
});
