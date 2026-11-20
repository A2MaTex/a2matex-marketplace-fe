import styles from "../SubmissionsPage.module.css";

const LABELS = {
  PENDING_SCAN: "Pending scan",
  READY_FOR_REVIEW: "Ready for review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const SubmissionStatusBadge = ({ status }) => (
  <span className={`${styles.statusBadge} ${styles[`status${status}`]}`}>
    {LABELS[status] ?? status}
  </span>
);

export default SubmissionStatusBadge;
