import { MdCheckCircle, MdErrorOutline, MdSchedule } from "react-icons/md";
import styles from "../EntitlementManagementPage.module.css";

const ICONS = {
  ACTIVE: MdCheckCircle,
  EXPIRED: MdSchedule,
  REVOKED: MdErrorOutline,
};

export default function AdminEntitlementStatus({ status, label }) {
  const Icon = ICONS[status] ?? MdErrorOutline;
  return (
    <span className={`${styles.status} ${styles[`status${status}`]}`}>
      <Icon aria-hidden="true" />
      {label ?? status}
    </span>
  );
}
