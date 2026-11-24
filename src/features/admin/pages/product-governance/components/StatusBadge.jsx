import styles from "../page/AdminProductGovernance.module.css";

const LABELS = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  ARCHIVED: "Archived",
  BUILDING: "Building",
  PUBLISHED: "Published",
  BUILD_FAILED: "Build failed",
  DISABLED: "Disabled",
};

export default function StatusBadge({ status, current = false }) {
  return (
    <span className={`${styles.status} ${styles[`status${status}`] || ""}`}>
      <span aria-hidden="true" />
      {LABELS[status] || status}
      {current ? " · Current" : ""}
    </span>
  );
}
