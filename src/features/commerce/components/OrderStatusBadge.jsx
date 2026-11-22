import { FiCheckCircle } from "react-icons/fi";
import styles from "./CommercePages.module.css";

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`${styles.statusBadge} ${styles.statusPaid}`}>
      <FiCheckCircle aria-hidden="true" /> {status}
    </span>
  );
}
