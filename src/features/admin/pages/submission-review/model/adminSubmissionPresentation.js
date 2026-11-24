export const SUBMISSION_STATUS_LABELS = {
  PENDING_SCAN: "Pending scan",
  READY_FOR_REVIEW: "Ready for review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const SCAN_STATUS_LABELS = {
  QUEUED: "Queued",
  RUNNING: "Running",
  PASSED: "Passed",
  FAILED: "Failed",
  ERROR: "Technical error",
};

export const formatAdminSubmissionDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not available";

export const compactId = (value) =>
  typeof value === "string" && value.length > 12
    ? `${value.slice(0, 8)}…${value.slice(-4)}`
    : value;
