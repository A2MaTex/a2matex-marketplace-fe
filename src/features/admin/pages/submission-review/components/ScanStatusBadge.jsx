import {
  FiAlertTriangle,
  FiCheck,
  FiLoader,
  FiMinusCircle,
  FiX,
} from "react-icons/fi";
import { formatScanStatus } from "../model/adminSubmissionPresentation";
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
  const style = styles[`scan${status}`] ?? styles.scanUnknown;
  return (
    <span className={`${styles.badge} ${style}`}>
      <Icon aria-hidden="true" />
      {formatScanStatus(status)}
    </span>
  );
}
