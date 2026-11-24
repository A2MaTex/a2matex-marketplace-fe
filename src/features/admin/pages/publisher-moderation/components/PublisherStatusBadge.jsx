import base from "../../user-manage/page/UserManage.module.css";
import styles from "../page/AdminPublisherModeration.module.css";

export default function PublisherStatusBadge({ status }) {
  return (
    <span
      className={`${base.statusBadge} ${
        status === "ACTIVE" ? base.statusACTIVE : styles.statusBLOCKED
      }`}
    >
      <span aria-hidden="true" />
      {status}
    </span>
  );
}
