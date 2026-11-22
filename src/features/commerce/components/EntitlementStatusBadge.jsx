import { FiAlertOctagon, FiCheckCircle, FiClock } from "react-icons/fi";
import styles from "./CommercePages.module.css";

const ICONS = {
  ACTIVE: FiCheckCircle,
  EXPIRED: FiClock,
  REVOKED: FiAlertOctagon,
};

export default function EntitlementStatusBadge({ status }) {
  const Icon = ICONS[status] ?? FiClock;
  return (
    <span
      className={`${styles.statusBadge} ${styles[`status${status}`] ?? ""}`}
    >
      <Icon aria-hidden="true" /> {status}
    </span>
  );
}
