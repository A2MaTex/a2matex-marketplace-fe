import { FiChevronLeft, FiChevronRight, FiPackage, FiRefreshCw } from "react-icons/fi";
import ReleaseStatusBadge from "./components/ReleaseStatusBadge";
import styles from "./ProductReleasesPage.module.css";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value))
    : "Not published";

const ReleaseDirectory = ({
  data,
  loading,
  error,
  selectedId,
  expectedSubmissionId,
  onSelect,
  onPageChange,
  onRetry,
}) => (
  <aside className={styles.directory} aria-label="Product release history">
    {loading ? <div className={styles.loadingBar} /> : null}
    {error ? (
      <div className={styles.directoryState} role="alert">
        <FiPackage />
        <strong>Release history unavailable</strong>
        <p>{error.message}</p>
        <button type="button" onClick={onRetry}><FiRefreshCw /> Retry</button>
      </div>
    ) : null}
    {!loading && !error && data.items.length === 0 ? (
      <div className={styles.directoryState}>
        <FiPackage />
        <strong>{expectedSubmissionId ? "Waiting for release record" : "No releases yet"}</strong>
        <p>
          {expectedSubmissionId
            ? "The submission was approved and its build request was accepted. The worker may need a moment to create the release record."
            : "Approved submissions will appear here after the release worker creates a build record."}
        </p>
        <button type="button" onClick={onRetry}><FiRefreshCw /> Check again</button>
      </div>
    ) : null}
    {!error && data.items.length ? (
      <ul className={styles.releaseList}>
        {data.items.map((release) => (
          <li key={release.id}>
            <button
              type="button"
              className={`${styles.releaseCard} ${selectedId === release.id ? styles.releaseCardSelected : ""}`}
              onClick={() => onSelect(release.id)}
              aria-pressed={selectedId === release.id}
            >
              <div className={styles.cardTitleRow}>
                <strong>v{release.version}</strong>
                {release.isCurrent ? <span className={styles.currentMark}>CURRENT</span> : null}
              </div>
              <ReleaseStatusBadge status={release.status} />
              <small>{formatDate(release.publishedAt ?? release.createdAt)}</small>
              <p>{release.changelog}</p>
            </button>
          </li>
        ))}
      </ul>
    ) : null}
    {data.totalPages > 1 ? (
      <footer className={styles.pagination}>
        <button type="button" onClick={() => onPageChange(data.page - 1)} disabled={data.page <= 1} aria-label="Previous page"><FiChevronLeft /></button>
        <span>Page {data.page} of {data.totalPages}</span>
        <button type="button" onClick={() => onPageChange(data.page + 1)} disabled={data.page >= data.totalPages} aria-label="Next page"><FiChevronRight /></button>
      </footer>
    ) : null}
  </aside>
);

export default ReleaseDirectory;
