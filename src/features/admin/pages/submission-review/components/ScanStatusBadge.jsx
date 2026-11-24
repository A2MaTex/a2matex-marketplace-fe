import {
  FiAlertTriangle,
  FiCheck,
  FiLoader,
  FiMinusCircle,
  FiX,
} from "react-icons/fi";
import { SCAN_STATUS_LABELS } from "../model/adminSubmissionPresentation";
import styles from "../page/AdminSubmissionReview.module.css";

const ICONS = {
  QUEUED: FiLoader,
  RUNNING: FiLoader,
  PASSED: FiCheck,
  FAILED: FiX,
  ERROR: FiAlertTriangle,
};

export default function ScanStatusBadge({ status }) {
  const Icon = ICONS[status] ?? FiMinusCircle;
  return (
    <span className={`${styles.badge} ${styles[`scan${status}`]}`}>
      <Icon aria-hidden="true" />
      {SCAN_STATUS_LABELS[status] ?? status}
    </span>
  );
}
