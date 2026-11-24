import { useEffect, useMemo } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { formatCommerceDate } from "@/features/commerce/model/date";
import { ErrorState, LoadingState, Pagination } from "../components/GovernanceState";
import StatusBadge from "../components/StatusBadge";
import {
  useAdminProduct,
  useAdminProductReleases,
} from "../hooks/useAdminProductGovernance";
import {
  readReleasePagination,
  releasePaginationToSearchParams,
} from "../model/adminProductContract";
import styles from "./AdminProductGovernance.module.css";

export default function AdminProductReleasesPage() {
  const { productId } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const pagination = useMemo(
    () => readReleasePagination(new URLSearchParams(searchKey)),
    [searchKey],
  );
  const query = useMemo(() => ({ page: pagination.page, limit: pagination.limit }), [pagination]);
  const product = useAdminProduct(productId);
  const releases = useAdminProductReleases(productId, { query });

  useEffect(() => {
    if (
      releases.loading || releases.error || pagination.page <= 1 ||
      releases.data.totalPages === 0 || pagination.page <= releases.data.totalPages
    ) return;
    setSearchParams(
      releasePaginationToSearchParams({ ...pagination, page: Math.max(releases.data.totalPages, 1) }),
      { replace: true },
    );
  }, [pagination, releases.data.totalPages, releases.error, releases.loading, setSearchParams]);

  if (product.loading) return <LoadingState label="Loading Product…" />;
  if (product.error) return <ErrorState error={product.error} onRetry={product.refetch} />;

  return (
    <div className={styles.detailPage}>
      <Link
        to={`/admin/products/${productId}`}
        state={{ from: location.state?.productListFrom || "/admin/products" }}
        className={styles.backLink}
      >
        ← Product overview
      </Link>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <span className={styles.eyebrow}>Product releases</span>
          <h1>{product.data?.name || "Untitled Product"}</h1>
          <div className={styles.statusRow}><StatusBadge status={product.data?.status} /></div>
          <p>Published artifacts, build outcomes and current release selection.</p>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={releases.refetch} disabled={releases.loading}>
          <FiRefreshCw aria-hidden="true" /> Refresh
        </button>
      </section>

      <nav className={styles.tabs} aria-label="Product sections">
        <Link
          className={styles.tab}
          to={`/admin/products/${productId}`}
          state={{ from: location.state?.productListFrom || "/admin/products" }}
        >
          Overview
        </Link>
        <Link className={`${styles.tab} ${styles.tabActive}`} to={`/admin/products/${productId}/releases`}>Releases</Link>
      </nav>

      <section className={styles.directory} aria-live="polite">
        <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>Release history</span><h2>Releases</h2></div><span className={styles.muted}>{releases.data.totalItems} total</span></div>
        {releases.loading ? <LoadingState label="Loading releases…" /> : releases.error ? (
          <ErrorState error={releases.error} onRetry={releases.refetch} />
        ) : releases.data.items.length === 0 ? (
          <div className={styles.statePanel}><h3>No releases</h3><p>This Product does not have any release records yet.</p></div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Version</th><th>Status</th><th>Submission</th><th>Minimum versions</th><th>Build failure</th><th>Published</th><th>Created</th></tr></thead>
              <tbody>
                {releases.data.items.map((release) => {
                  const releaseUrl = `/admin/products/${productId}/releases/${release.id}`;
                  return (
                    <tr key={release.id}>
                      <td data-label="Version"><div className={styles.cellTitle}><Link to={releaseUrl} state={{ from: `${location.pathname}${location.search}`, productListFrom: location.state?.productListFrom }}>{release.version || "Unversioned"}</Link><small>{release.isCurrent ? "Current release" : "Historical release"}</small></div></td>
                      <td data-label="Status"><StatusBadge status={release.status} current={release.isCurrent} /></td>
                      <td data-label="Submission"><Link className={styles.viewLink} to={`/admin/submissions/${release.submissionId}`}>Review submission</Link></td>
                      <td data-label="Minimum versions"><div className={styles.cellTitle}><span>Launcher {release.minimumLauncherVersion}</span><small>Runtime {release.minimumRuntimeVersion}</small></div></td>
                      <td data-label="Build failure">{release.buildFailureCode || "—"}</td>
                      <td data-label="Published">{release.publishedAt ? formatCommerceDate(release.publishedAt, { withTime: true }) : "—"}</td>
                      <td data-label="Created">{formatCommerceDate(release.createdAt, { withTime: true })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={releases.data.page} totalPages={releases.data.totalPages} totalItems={releases.data.totalItems} onChange={(page) => setSearchParams(releasePaginationToSearchParams({ ...pagination, page }))} />
      </section>
    </div>
  );
}
