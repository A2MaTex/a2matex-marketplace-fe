import {
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiImage,
  FiRefreshCw,
} from "react-icons/fi";
import StaticImage from "../components/StaticImage";
import SubmissionStatusBadge from "./components/SubmissionStatusBadge";
import styles from "./SubmissionsPage.module.css";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const SubmissionIcon = ({ submission }) =>
  submission.product.iconStaticId ? (
    <StaticImage
      staticId={submission.product.iconStaticId}
      variant="small"
      alt=""
      className={styles.productIcon}
    />
  ) : (
    <span className={styles.productIconFallback} aria-hidden="true">
      <FiImage />
    </span>
  );

const SubmissionDirectory = ({
  data,
  loading,
  error,
  selectedId,
  onSelect,
  onPageChange,
  onRetry,
}) => (
  <aside className={styles.directory} aria-label="Submission directory">
    {loading ? <div className={styles.loadingBar} aria-label="Loading submissions" /> : null}

    {error ? (
      <div className={styles.directoryState} role="alert">
        <FiRefreshCw />
        <strong>Submissions unavailable</strong>
        <p>{error.message}</p>
        <button type="button" onClick={onRetry}>Retry</button>
      </div>
    ) : null}

    {!error && !loading && data.items.length === 0 ? (
      <div className={styles.directoryState}>
        <FiFileText />
        <strong>No submissions found</strong>
        <p>Change the filters or create a submission from an eligible product.</p>
      </div>
    ) : null}

    {!error && data.items.length > 0 ? (
      <ul className={styles.submissionList}>
        {data.items.map((submission) => {
          const selected = selectedId === submission.id;
          return (
            <li key={submission.id}>
              <button
                type="button"
                className={`${styles.submissionCard} ${selected ? styles.submissionCardSelected : ""}`}
                onClick={() => onSelect(submission.id)}
                aria-current={selected ? "page" : undefined}
              >
                <SubmissionIcon submission={submission} />
                <span className={styles.cardBody}>
                  <span className={styles.cardTitleRow}>
                    <strong>{submission.product.name}</strong>
                    <span>#{submission.number}</span>
                  </span>
                  <span className={styles.cardVersion}>v{submission.requestedVersion}</span>
                  <small>{formatDate(submission.createdAt)}</small>
                </span>
                <SubmissionStatusBadge status={submission.status} />
              </button>
            </li>
          );
        })}
      </ul>
    ) : null}

    {data.totalPages > 1 ? (
      <footer className={styles.pagination}>
        <button
          type="button"
          onClick={() => onPageChange(data.page - 1)}
          disabled={loading || data.page <= 1}
          aria-label="Previous submission page"
        >
          <FiChevronLeft />
        </button>
        <span>Page <strong>{data.page}</strong> / {data.totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(data.page + 1)}
          disabled={loading || data.page >= data.totalPages}
          aria-label="Next submission page"
        >
          <FiChevronRight />
        </button>
      </footer>
    ) : null}
  </aside>
);

export default SubmissionDirectory;
