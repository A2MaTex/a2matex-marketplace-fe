import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import styles from "../page/AdminProductGovernance.module.css";

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className={styles.loadingRows} aria-busy="true">
      {Array.from({ length: 5 }, (_, index) => (
        <div className={styles.skeleton} key={index} />
      ))}
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className={styles.statePanel} role="alert">
      <div className={styles.stateIcon}>!</div>
      <h2>{error.status === 403 ? "Administrator permission required" : "Unable to load data"}</h2>
      <p>{error.message}</p>
      {error.retryable || error.status === 409 ? (
        <button type="button" className={styles.secondaryButton} onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function Pagination({ page, totalPages, totalItems, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <span>Page {page} of {totalPages} · {totalItems} records</span>
      <div className={styles.paginationActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <FiChevronLeft aria-hidden="true" />
          <span className={styles.srOnly}>Previous page</span>
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <FiChevronRight aria-hidden="true" />
          <span className={styles.srOnly}>Next page</span>
        </button>
      </div>
    </nav>
  );
}
