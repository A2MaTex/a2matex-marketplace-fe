import styles from "../LauncherReleasePage.module.css";

export function StatusBadge({ isActive, isStaged }) {
  if (isActive)
    return (
      <span className={`${styles.badge} ${styles.badgeActive}`}>
        ● ACTIVE · PRODUCTION
      </span>
    );
  if (isStaged)
    return (
      <span className={`${styles.badge} ${styles.badgeStaged}`}>
        ● INACTIVE (STAGED)
      </span>
    );
  return (
    <span className={`${styles.badge} ${styles.badgeArchived}`}>ARCHIVED</span>
  );
}
