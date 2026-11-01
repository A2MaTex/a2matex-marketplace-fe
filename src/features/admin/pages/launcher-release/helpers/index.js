// ─── helpers ──────────────────────────────────────────────
export function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toISOString().replace("T", " • ").slice(0, 22) + " UTC";
}