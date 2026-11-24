import { useState } from "react";
import { FiDownload, FiRefreshCw } from "react-icons/fi";
import { Link, useLocation, useParams } from "react-router-dom";
import { formatCommerceDate } from "@/features/commerce/model/date";
import BoundedJsonInspector from "../components/BoundedJsonInspector";
import DisableReleaseDialog from "../components/DisableReleaseDialog";
import { ErrorState, LoadingState } from "../components/GovernanceState";
import SelectCurrentReleaseDialog from "../components/SelectCurrentReleaseDialog";
import StatusBadge from "../components/StatusBadge";
import {
  useAdminProduct,
  useAdminProductRelease,
} from "../hooks/useAdminProductGovernance";
import { canSelectCurrentRelease } from "../model/adminProductContract";
import styles from "./AdminProductGovernance.module.css";

const formatBytes = (value) => {
  if (value === null) return "—";
  const bytes = BigInt(value);
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let unit = 0;
  let divisor = 1n;
  while (unit < units.length - 1 && bytes >= divisor * 1024n) {
    divisor *= 1024n;
    unit += 1;
  }
  if (unit === 0) return `${bytes.toLocaleString()} B`;
  const tenths = (bytes * 10n) / divisor;
  return `${tenths / 10n}.${tenths % 10n} ${units[unit]}`;
};

export default function AdminProductReleaseDetailPage() {
  const { productId, releaseId } = useParams();
  const location = useLocation();
  const productState = useAdminProduct(productId);
  const releaseState = useAdminProductRelease(productId, releaseId);
  const currentReleaseState = useAdminProductRelease(
    productId,
    productState.data?.currentReleaseId,
    {
      enabled:
        Boolean(productState.data?.currentReleaseId) &&
        productState.data?.currentReleaseId !== releaseId,
    },
  );
  const [dialog, setDialog] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const backTo = location.state?.from || `/admin/products/${productId}/releases`;

  if (productState.loading || releaseState.loading) return <LoadingState label="Loading release…" />;
  if (productState.error) return <ErrorState error={productState.error} onRetry={productState.refetch} />;
  if (releaseState.error) return <ErrorState error={releaseState.error} onRetry={releaseState.refetch} />;
  const product = productState.data;
  const release = releaseState.data;
  if (!product || !release) return null;

  const selectable = canSelectCurrentRelease(product, release);
  const disableAvailable = release.status === "PUBLISHED";
  const refetchAll = () => {
    productState.refetch();
    releaseState.refetch();
  };
  const mutationSuccess = (message) => {
    setDialog(null);
    setAnnouncement(message);
    refetchAll();
  };

  return (
    <div className={styles.detailPage}>
      <Link
        to={backTo}
        state={{ productListFrom: location.state?.productListFrom }}
        className={styles.backLink}
      >
        ← Back to releases
      </Link>
      <div className={styles.srOnly} role="status" aria-live="polite">{announcement}</div>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <span className={styles.eyebrow}>Product release</span>
          <h1>Version {release.version || "—"}</h1>
          <div className={styles.statusRow}>
            <StatusBadge status={release.status} current={release.isCurrent} />
          </div>
          <p>{product.name || "Untitled Product"}</p>
        </div>
        <div className={styles.heroActions}>
          <button type="button" className={styles.secondaryButton} onClick={refetchAll}>
            <FiRefreshCw aria-hidden="true" /> Refresh
          </button>
          {release.downloadUrl ? (
            <a className={styles.secondaryButton} href={release.downloadUrl} target="_blank" rel="noreferrer">
              <FiDownload aria-hidden="true" /> Download package
            </a>
          ) : null}
          {selectable ? (
            <button type="button" className={styles.primaryButton} onClick={() => setDialog("select")}>
              Select as current
            </button>
          ) : null}
          {disableAvailable ? (
            <button type="button" className={styles.dangerButton} onClick={() => setDialog("disable")}>
              Disable release
            </button>
          ) : null}
        </div>
      </section>

      {product.status === "ACTIVE" && !release.isCurrent && release.status === "PUBLISHED" ? (
        <div className={styles.warning} role="note">
          Standalone current-release selection is intentionally unavailable for an active Product. Change it only as the replacement in the current-release disable flow.
        </div>
      ) : null}

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Release metadata</h2>
          <dl className={styles.definitionGrid}>
            <div><dt>Submission</dt><dd><Link to={`/admin/submissions/${release.submissionId}`}>Open submission review</Link></dd></div>
            <div><dt>Workflow revision</dt><dd>Revision evidence recorded</dd></div>
            <div><dt>Created</dt><dd>{formatCommerceDate(release.createdAt, { withTime: true })}</dd></div>
            <div><dt>Published</dt><dd>{release.publishedAt ? formatCommerceDate(release.publishedAt, { withTime: true }) : "—"}</dd></div>
            <div><dt>Minimum Launcher</dt><dd>{release.minimumLauncherVersion || "—"}</dd></div>
            <div><dt>Minimum Runtime</dt><dd>{release.minimumRuntimeVersion || "—"}</dd></div>
            {release.buildFailureCode ? <div className={styles.fullWidth}><dt>Build failure code</dt><dd>{release.buildFailureCode}</dd></div> : null}
          </dl>
        </section>

        <section className={styles.card}>
          <h2>Package integrity</h2>
          <dl className={styles.definitionGrid}>
            <div><dt>Package size</dt><dd>{formatBytes(release.packageSizeBytes)}</dd></div>
            <div className={styles.fullWidth}><dt>Package hash</dt><dd className={styles.mono}>{release.packageHash || "—"}</dd></div>
          </dl>
          <h3>Required capabilities</h3>
          {release.requiredCapabilities.length ? (
            <ul className={styles.capabilities}>{release.requiredCapabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul>
          ) : <p className={styles.muted}>No capabilities declared.</p>}
        </section>

        <section className={`${styles.card} ${styles.cardWide}`}>
          <h2>Changelog</h2>
          <p>{release.changelog || <span className={styles.muted}>No changelog supplied.</span>}</p>
        </section>

        {release.disabledAt || release.disabledReason ? (
          <section className={`${styles.card} ${styles.cardWide}`}>
            <h2>Disable audit</h2>
            <dl className={styles.definitionGrid}>
              <div><dt>Disabled at</dt><dd>{release.disabledAt ? formatCommerceDate(release.disabledAt, { withTime: true }) : "—"}</dd></div>
              <div className={styles.fullWidth}><dt>Reason</dt><dd>{release.disabledReason || "—"}</dd></div>
            </dl>
          </section>
        ) : null}

        <section className={`${styles.card} ${styles.cardWide}`}>
          <h2>Input schema</h2>
          <BoundedJsonInspector value={release.inputSchema} />
        </section>
      </div>

      {dialog === "select" ? (
        <SelectCurrentReleaseDialog
          product={product}
          release={release}
          currentRelease={currentReleaseState.data}
          onClose={() => setDialog(null)}
          onSuccess={() => mutationSuccess("Current release updated successfully.")}
          onVerify={refetchAll}
        />
      ) : null}
      {dialog === "disable" ? (
        <DisableReleaseDialog
          product={product}
          release={release}
          onClose={() => setDialog(null)}
          onSuccess={() => mutationSuccess("Release disabled successfully.")}
          onVerify={refetchAll}
        />
      ) : null}
    </div>
  );
}
