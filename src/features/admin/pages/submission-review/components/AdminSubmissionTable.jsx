import {
  FiArrowUpRight,
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiInbox,
} from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import StaticImage from "@/features/publisher/pages/components/StaticImage";
import {
  formatAdminSubmissionDate,
} from "../model/adminSubmissionPresentation";
import { useAdminSubmissionReferences } from "../hooks/useAdminSubmissionReferences";
import ScanStatusBadge from "./ScanStatusBadge";
import ScanSummary from "./ScanSummary";
import SubmissionStatusBadge from "./SubmissionStatusBadge";
import styles from "../page/AdminSubmissionReview.module.css";

const ProductIcon = ({ item }) =>
  item.product.iconStaticId ? (
    <StaticImage
      staticId={item.product.iconStaticId}
      variant="small"
      alt={`${item.product.name} icon`}
      className={styles.productIcon}
    />
  ) : (
    <span className={styles.productIconFallback} aria-hidden="true"><FiImage /></span>
  );

const LoadingRows = () => (
  <div className={styles.tableSkeleton} aria-label="Loading submissions" aria-live="polite">
    {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
  </div>
);

export default function AdminSubmissionTable({ data, loading, filtered, onPageChange }) {
  const location = useLocation();
  const references = useAdminSubmissionReferences({
    userIds: data.items.map((item) => item.createdById),
  });
  const returnTo = `${location.pathname}${location.search}`;
  const firstResult = data.totalItems ? (data.page - 1) * data.limit + 1 : 0;
  const lastResult = Math.min(data.page * data.limit, data.totalItems);

  if (loading && data.items.length === 0) return <LoadingRows />;

  if (!loading && data.items.length === 0) {
    return (
      <section className={styles.emptyState}>
        <span><FiInbox /></span>
        <h2>No submissions found</h2>
        <p>Try another review status or remove the exact Product UUID filter.</p>
      </section>
    );
  }

  return (
    <section className={styles.tableCard} aria-busy={loading}>
      {loading ? <div className={styles.loadingLine} /> : null}
      <header className={styles.directoryHeader}>
        <div>
          <span className={styles.eyebrow}>Submission directory</span>
          <h2>{filtered ? "Filtered submissions" : "All submissions"}</h2>
        </div>
        <span>{firstResult}–{lastResult} of {data.totalItems}</span>
      </header>
      <div className={styles.tableScroller}>
        <table className={styles.submissionTable}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Submission</th>
              <th>Submitted by</th>
              <th>Review status</th>
              <th>Scanner</th>
              <th>Findings</th>
              <th>Updated</th>
              <th><span className={styles.srOnly}>Open</span></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => {
              const updatedAt = item.updatedAt ?? item.createdAt;
              return (
                <tr key={item.id}>
                  <td data-label="Product">
                    <div className={styles.productCell}>
                      <ProductIcon item={item} />
                      <span>
                        <strong>{item.product.name}</strong>
                        <small>{item.product.slug}</small>
                      </span>
                    </div>
                  </td>
                  <td data-label="Submission">
                    <div className={styles.submissionCell}>
                      <strong>v{item.requestedVersion}</strong>
                    </div>
                  </td>
                  <td data-label="Submitted by">
                    <div className={styles.personCell}>
                      <strong>{references.users[item.createdById]?.name ?? "Loading user…"}</strong>
                      {references.users[item.createdById]?.secondary ? (
                        <small>{references.users[item.createdById].secondary}</small>
                      ) : null}
                    </div>
                  </td>
                  <td data-label="Review status"><SubmissionStatusBadge status={item.status} /></td>
                  <td data-label="Scanner">
                    <div className={styles.scanCell}>
                      <ScanStatusBadge status={item.scanStatus} />
                    </div>
                  </td>
                  <td data-label="Findings"><ScanSummary summary={item.scanSummary} compact /></td>
                  <td data-label="Updated">
                    <time dateTime={updatedAt} title={updatedAt}>
                      {formatAdminSubmissionDate(updatedAt)}
                    </time>
                  </td>
                  <td className={styles.openCell}>
                    <Link
                      to={`/admin/submissions/${item.id}`}
                      state={{ from: returnTo }}
                      aria-label={`Review submission ${item.number} for ${item.product.name}`}
                    >
                      <span>View evidence</span><FiArrowUpRight />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className={styles.pagination}>
        <p>
          Page <strong>{data.page}</strong>
          <span>of {Math.max(data.totalPages, 1)}</span>
        </p>
        <div>
          <button
            type="button"
            onClick={() => onPageChange(data.page - 1)}
            disabled={loading || data.page <= 1}
            aria-label="Previous page"
          ><FiChevronLeft /></button>
          <button
            type="button"
            onClick={() => onPageChange(data.page + 1)}
            disabled={loading || data.page >= data.totalPages}
            aria-label="Next page"
          ><FiChevronRight /></button>
        </div>
      </footer>
    </section>
  );
}
