const SENSITIVE_KEY_PATTERN =
  /(?:authorization|password|passwd|token|secret|cookie|api[-_]?key)/i;

const redact = (value, seen) => {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[Redacted]" : redact(item, seen),
    ]),
  );
};

export const formatAuditEvidence = (value, maxLength = 6000) => {
  const formatted = JSON.stringify(redact(value, new WeakSet()), null, 2);
  if (formatted.length <= maxLength) return formatted;
  return `${formatted.slice(0, maxLength)}\n… evidence truncated`;
};

export const auditEntryMeta = (entry, index) => {
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
    return {
      title: `Audit event ${index + 1}`,
      actor: null,
      timestamp: null,
      before: null,
      after: null,
      raw: entry,
    };
  }

  return {
    title:
      entry.action ?? entry.event ?? entry.type ?? `Audit event ${index + 1}`,
    actor:
      entry.actorId ?? entry.updatedById ?? entry.grantedById ?? entry.revokedById ?? null,
    timestamp:
      entry.createdAt ?? entry.updatedAt ?? entry.timestamp ?? entry.occurredAt ?? null,
    before: Object.prototype.hasOwnProperty.call(entry, "before")
      ? entry.before
      : null,
    after: Object.prototype.hasOwnProperty.call(entry, "after")
      ? entry.after
      : null,
    raw: entry,
  };
};
