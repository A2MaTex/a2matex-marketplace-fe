import {
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiEye,
  FiXCircle,
} from "react-icons/fi";
import { SUBMISSION_STATUS_LABELS } from "../model/adminSubmissionPresentation";
import styles from "../page/AdminSubmissionReview.module.css";

const ICONS = {
  PENDING_SCAN: FiClock,
  READY_FOR_REVIEW: FiEye,
  CHANGES_REQUESTED: FiEdit3,
  APPROVED: FiCheckCircle,
  REJECTED: FiXCircle,
};

export default function SubmissionStatusBadge({ status }) {
  const Icon = ICONS[status] ?? FiClock;
  return (
    <span className={`${styles.badge} ${styles[`submission${status}`]}`}>
      <Icon aria-hidden="true" />
      {SUBMISSION_STATUS_LABELS[status] ?? status}
    </span>
  );
}
