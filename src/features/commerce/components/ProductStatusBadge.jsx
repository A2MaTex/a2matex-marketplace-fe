import {
  FiAlertOctagon,
  FiArchive,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import styles from "./CommercePages.module.css";

const ICONS = {
  DRAFT: FiClock,
  ACTIVE: FiCheckCircle,
  SUSPENDED: FiAlertOctagon,
  ARCHIVED: FiArchive,
};

export default function ProductStatusBadge({ status }) {
  const Icon = ICONS[status] ?? FiClock;

  return (
    <span
      className={`${styles.productStatusBadge} ${styles[`productStatus${status}`] ?? ""}`}
      aria-label={`Current product status: ${status}`}
      title="Current product status"
    >
      <Icon aria-hidden="true" /> {status}
    </span>
  );
}
