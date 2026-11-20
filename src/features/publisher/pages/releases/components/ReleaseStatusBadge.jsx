import styles from "../ProductReleasesPage.module.css";

const ReleaseStatusBadge = ({ status }) => (
  <span className={`${styles.statusBadge} ${styles[`status${status}`] ?? ""}`}>
    {status.replaceAll("_", " ")}
  </span>
);

export default ReleaseStatusBadge;
