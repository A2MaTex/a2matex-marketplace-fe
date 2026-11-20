import {
  FiCheckCircle,
  FiCode,
  FiDownload,
  FiFileText,
  FiPackage,
  FiRefreshCw,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import ReleaseStatusBadge from "./components/ReleaseStatusBadge";
import { releaseSelectionReason } from "./model/releasePermissions";
import styles from "./ProductReleasesPage.module.css";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not available";

const formatBytes = (value) => {
  if (!value || !/^\d+$/.test(value)) return "Not available";
  const bytes = Number(value);
  if (!Number.isSafeInteger(bytes)) return `${value} bytes`;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
};

const ReleaseDetail = ({
  data,
  product,
  loading,
  error,
  busy,
  notice,
  actionError,
  onRetry,
  onSelectCurrent,
}) => {
  if (loading)
    return (
      <section className={styles.detailState}>
        <span className={styles.spinner} />
        <strong>Loading release detail…</strong>
      </section>
    );
  if (error)
    return (
      <section className={styles.detailState} role="alert">
        <FiPackage />
        <strong>Release unavailable</strong>
        <p>{error.message}</p>
        <button type="button" onClick={onRetry}>
          <FiRefreshCw /> Retry
        </button>
      </section>
    );
  if (!data)
    return (
      <section className={styles.detailState}>
        <FiPackage />
        <strong>Choose a release</strong>
        <p>
          Select a release to inspect its immutable package and compatibility
          metadata.
        </p>
      </section>
    );

  const selectionReason = releaseSelectionReason({ release: data, product });
  return (
    <article className={styles.detail}>
      <header className={styles.detailHeader}>
        <div>
          <p className={styles.eyebrow}>Product release</p>
          <h2>Version {data.version}</h2>
          <span>Created {formatDate(data.createdAt)}</span>
        </div>
        <div className={styles.detailHeaderMeta}>
          <ReleaseStatusBadge status={data.status} />
          {data.isCurrent ? (
            <span className={styles.currentMark}>CURRENT</span>
          ) : null}
        </div>
      </header>

      {notice ? (
        <div className={styles.successNotice} role="status">
          <FiCheckCircle /> {notice}
        </div>
      ) : null}
      {actionError ? (
        <div className={styles.actionError} role="alert">
          {actionError.message}
        </div>
      ) : null}

      <div className={styles.detailGrid}>
        <section className={styles.panel}>
          <header>
            <FiFileText />
            <div>
              <h3>Release metadata</h3>
              <p>Immutable values approved with the submission.</p>
            </div>
          </header>
          <dl>
            <div>
              <dt>Published</dt>
              <dd>{formatDate(data.publishedAt)}</dd>
            </div>
            <div>
              <dt>Launcher</dt>
              <dd>≥ {data.minimumLauncherVersion}</dd>
            </div>
            <div>
              <dt>Runtime</dt>
              <dd>≥ {data.minimumRuntimeVersion}</dd>
            </div>
            <div>
              <dt>Submission</dt>
              <dd>
                <Link to={`/publisher/submissions/${data.submissionId}`}>
                  Open submission
                </Link>
              </dd>
            </div>
          </dl>
        </section>
        <section className={styles.panel}>
          <header>
            <FiPackage />
            <div>
              <h3>Package evidence</h3>
              <p>Server-provided artifact metadata.</p>
            </div>
          </header>
          <dl>
            <div>
              <dt>Size</dt>
              <dd>{formatBytes(data.packageSizeBytes)}</dd>
            </div>
            <div>
              <dt>Capabilities</dt>
              <dd>{data.requiredCapabilities.length || "None"}</dd>
            </div>
          </dl>
          {data.downloadUrl ? (
            <a
              className={styles.downloadLink}
              href={data.downloadUrl}
              target="_blank"
              rel="noreferrer"
            >
              <FiDownload /> Download package
            </a>
          ) : null}
        </section>
      </div>

      <section className={styles.panel}>
        <header>
          <FiFileText />
          <div>
            <h3>Changelog</h3>
            <p>Customer-facing changes captured at submission time.</p>
          </div>
        </header>
        <p className={styles.longText}>{data.changelog}</p>
      </section>

      <section className={styles.panel}>
        <header>
          <FiCode />
          <div>
            <h3>Runtime contract</h3>
            <p>Revision {data.workflowRevisionId}</p>
          </div>
        </header>
        {data.requiredCapabilities.length ? (
          <ul className={styles.capabilities}>
            {data.requiredCapabilities.map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>No required capabilities declared.</p>
        )}
        <details className={styles.jsonBlock}>
          <summary>Input schema</summary>
          <pre>{JSON.stringify(data.inputSchema, null, 2)}</pre>
        </details>
      </section>

      {data.status === "DISABLED" ? (
        <div className={styles.warning}>
          Disabled {formatDate(data.disabledAt)}.{" "}
          {data.disabledReason || "No public reason was supplied."}
        </div>
      ) : null}

      <footer className={styles.detailActions}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={Boolean(selectionReason) || busy}
          title={selectionReason ?? "Make this the current release"}
          onClick={onSelectCurrent}
        >
          <FiCheckCircle />{" "}
          {busy
            ? "Updating…"
            : data.isCurrent
              ? "Current release"
              : "Set as current"}
        </button>
      </footer>
    </article>
  );
};

export default ReleaseDetail;
