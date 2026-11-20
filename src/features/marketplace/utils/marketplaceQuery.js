export const buildMarketplaceListParams = ({ page, limit, q }) => {
  if (!Number.isInteger(page) || page <= 0) {
    throw new RangeError("page must be a positive integer.");
  }
  if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
    throw new RangeError("limit must be an integer from 1 to 100.");
  }

  const params = { page, limit };
  if (typeof q === "string") {
    const normalized = q.trim();
    if (normalized.length > 100) {
      throw new RangeError("q must not exceed 100 characters.");
    }
    if (normalized) params.q = normalized;
  }

  return params;
};
