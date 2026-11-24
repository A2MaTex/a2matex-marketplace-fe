import base from "../../user-manage/page/UserManage.module.css";
import styles from "../EntitlementManagementPage.module.css";

export default function AdminEntitlementStatus({ status, label }) {
  return (
    <span
      className={`${base.statusBadge} ${styles[`status${status}`] ?? ""}`}
    >
      <span aria-hidden="true" />
      {label ?? status}
    </span>
  );
}
