import styles from "../page/UserManage.module.css";

export default function AdminUserStatusBadge({ status }) {
  return (
    <span
      className={`${styles.statusBadge} ${styles[`status${status}`] ?? ""}`}
    >
      <span aria-hidden="true" />
      {status}
    </span>
  );
}
