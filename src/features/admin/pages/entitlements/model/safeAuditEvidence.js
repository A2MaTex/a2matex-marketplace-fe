const SENSITIVE_KEY_PATTERN =
  /(?:authorization|password|passwd|token|secret|cookie|api[-_]?key)/i;

const DEFAULT_LIMITS = {
  maxDepth: 6,
  maxEntries: 50,
  maxStringLength: 2000,
};

const redact = (value, seen, depth, limits) => {
  if (typeof value === "string") {
    return value.length <= limits.maxStringLength
      ? value
      : `${value.slice(0, limits.maxStringLength)}…`;
  }
  if (value === null || typeof value !== "object") return value;
  if (depth >= limits.maxDepth) return "[Depth limit]";
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    const result = value
      .slice(0, limits.maxEntries)
      .map((item) => redact(item, seen, depth + 1, limits));
    if (value.length > limits.maxEntries) result.push("[Entries truncated]");
    return result;
  }

  const entries = Object.entries(value).slice(0, limits.maxEntries);
  const result = Object.fromEntries(
    entries.map(([key, item]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key)
        ? "[Redacted]"
        : redact(item, seen, depth + 1, limits),
    ]),
  );
  if (Object.keys(value).length > limits.maxEntries) {
    result["…"] = "[Entries truncated]";
  }
  return result;
};

export const formatAuditEvidence = (
  value,
  maxLength = 6000,
  limits = DEFAULT_LIMITS,
) => {
  const formatted = JSON.stringify(
    redact(value, new WeakSet(), 0, { ...DEFAULT_LIMITS, ...limits }),
    null,
    2,
  );
  if (formatted.length <= maxLength) return formatted;
  return `${formatted.slice(0, maxLength)}\n… evidence truncated`;
};

export const auditEntryMeta = (entry) => ({
  title: entry.action === "GRANT" ? "Access granted or reset" : "Access revoked",
  action: entry.action,
  actor: entry.actedById,
  timestamp: entry.actedAt,
  reason: entry.reason,
  before: entry.before,
  after: entry.after,
});
