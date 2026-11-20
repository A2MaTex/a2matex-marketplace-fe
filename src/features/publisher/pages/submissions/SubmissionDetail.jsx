import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiCode,
  FiFileText,
  FiGitBranch,
  FiPackage,
  FiRefreshCw,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import SubmissionStatusBadge from "./components/SubmissionStatusBadge";
import styles from "./SubmissionsPage.module.css";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not available";

const statusCopy = {
  PENDING_SCAN: {
    title: "Automated scan in progress",
    body: "The Publisher response intentionally withholds scanner evidence. This page will refresh until the submission leaves the scan stage.",
    icon: FiClock,
  },
  READY_FOR_REVIEW: {
    title: "Waiting for administrator review",
    body: "The automated scan reached a reviewable result. An administrator now decides whether to approve, request changes or reject it.",
    icon: FiFileText,
  },
  CHANGES_REQUESTED: {
    title: "Changes are required",
    body: "Review the administrator feedback, update the project draft and create a new submission.",
    icon: FiGitBranch,
  },
  APPROVED: {
    title: "Approved for release build",
    body: "Approval starts the release build. It does not activate the product or publish it to the Marketplace.",
    icon: FiCheckCircle,
  },
  REJECTED: {
    title: "Submission rejected",
    body: "This submission is terminal. Review the feedback before deciding whether to prepare a new version.",
    icon: FiFileText,
  },
};

const JsonBlock = ({ title, value }) => (
  <details className={styles.jsonBlock}>
    <summary><FiCode /> {title}</summary>
    <pre>{JSON.stringify(value, null, 2)}</pre>
  </details>
);

const SubmissionDetail = ({ data, loading, error, onRetry }) => {
  if (loading) {
    return (
      <section className={styles.detailState} aria-live="polite">
        <span className={styles.spinner} />
        <strong>Loading submission detail...</strong>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.detailState} role="alert">
        <FiFileText />
        <strong>Submission unavailable</strong>
        <p>{error.message}</p>
        <button type="button" onClick={onRetry}><FiRefreshCw /> Retry</button>
      </section>
    );
  }

  if (!data) {
    return (
      <section className={styles.detailState}>
        <FiFileText />
        <strong>Choose a submission</strong>
        <p>Select an item from the directory to inspect its frozen product and workflow revision.</p>
      </section>
    );
  }

  const state = statusCopy[data.status];
  const StateIcon = state.icon;
  const snapshot = data.productSnapshot;
  const icon = snapshot.media.find((item) => item.type === "ICON");

  return (
    <article className={styles.detail}>
      <header className={styles.detailHeader}>
        <div>
          <p className={styles.eyebrow}>Submission #{data.number}</p>
          <h2>{snapshot.name}</h2>
          <span className={styles.slug}>{snapshot.slug}</span>
        </div>
        <div className={styles.detailHeaderMeta}>
          <SubmissionStatusBadge status={data.status} />
          <span>Requested v{data.releaseRequest.version}</span>
        </div>
      </header>

      <section className={`${styles.stateBanner} ${styles[`banner${data.status}`]}`}>
        <StateIcon />
        <div><strong>{state.title}</strong><p>{state.body}</p></div>
      </section>

      <div className={styles.detailGrid}>
        <section className={styles.panel}>
          <header><FiClock /><div><h3>Overview</h3><p>Immutable submission identity and timestamps.</p></div></header>
          <dl className={styles.definitionList}>
            <div><dt>Submission</dt><dd>#{data.number}</dd></div>
            <div><dt>Version</dt><dd>{data.releaseRequest.version}</dd></div>
            <div><dt>Created</dt><dd>{formatDate(data.createdAt)}</dd></div>
            <div><dt>Reviewed</dt><dd>{formatDate(data.reviewedAt)}</dd></div>
            <div><dt>Draft version</dt><dd>v{data.workflowRevision.sourceDraftVersion}</dd></div>
            <div><dt>Product icon</dt><dd>{icon ? "Frozen" : "None"}</dd></div>
          </dl>
        </section>

        <section className={styles.panel}>
          <header><FiPackage /><div><h3>Release request</h3><p>Requirements used by the release build.</p></div></header>
          <dl className={styles.definitionList}>
            <div><dt>Launcher</dt><dd>≥ {data.releaseRequest.minimumLauncherVersion}</dd></div>
            <div><dt>Runtime</dt><dd>≥ {data.releaseRequest.minimumRuntimeVersion}</dd></div>
          </dl>
          <div className={styles.textBlock}><strong>Changelog</strong><p>{data.releaseRequest.changelog}</p></div>
        </section>
      </div>

      <section className={styles.panel}>
        <header><FiFileText /><div><h3>Review context</h3><p>Instructions supplied to the administrator.</p></div></header>
        <div className={styles.textColumns}>
          <div className={styles.textBlock}><strong>Purpose</strong><p>{data.reviewContext.purpose}</p></div>
          <div className={styles.textBlock}><strong>Test instructions</strong><p>{data.reviewContext.testInstructions}</p></div>
        </div>
        <div className={styles.textBlock}>
          <strong>Known limitations</strong>
          {data.reviewContext.knownLimitations.length ? (
            <ul>{data.reviewContext.knownLimitations.map((item) => <li key={item}>{item}</li>)}</ul>
          ) : <p>No known limitations were declared.</p>}
        </div>
      </section>

      {data.reviewFeedback ? (
        <section className={`${styles.panel} ${styles.feedbackPanel}`}>
          <header><FiGitBranch /><div><h3>Administrator feedback</h3><p>Actionable review notes.</p></div></header>
          <div className={styles.textBlock}><strong>Summary</strong><p>{data.reviewFeedback.summary}</p></div>
          {data.reviewFeedback.items.length ? (
            <ul className={styles.feedbackList}>
              {data.reviewFeedback.items.map((item, index) => (
                <li key={`${item.nodeId ?? "general"}:${index}`}>
                  {item.nodeId ? <code>{item.nodeId}</code> : null}
                  <span>{item.message}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className={styles.panel}>
        <header><FiPackage /><div><h3>Frozen product snapshot</h3><p>Marketplace content captured when this submission was created.</p></div></header>
        <div className={styles.textBlock}><strong>Short description</strong><p>{snapshot.shortDescription}</p></div>
        <div className={styles.textColumns}>
          <div className={styles.textBlock}><strong>Description</strong><p>{snapshot.description}</p></div>
          <div className={styles.textBlock}><strong>Usage instructions</strong><p>{snapshot.usageInstructions || "Not provided"}</p></div>
        </div>
        <p className={styles.mediaSummary}>{snapshot.media.length} frozen media asset{snapshot.media.length === 1 ? "" : "s"}</p>
      </section>

      <section className={styles.panel}>
        <header><FiCode /><div><h3>Workflow revision</h3><p>Read-only technical evidence for draft v{data.workflowRevision.sourceDraftVersion}.</p></div></header>
        <dl className={styles.hashList}>
          <div><dt>Draft hash</dt><dd>{data.workflowRevision.sourceDraftContentHash}</dd></div>
          <div><dt>Revision hash</dt><dd>{data.workflowRevision.contentHash}</dd></div>
        </dl>
        <div className={styles.jsonGrid}>
          <JsonBlock title="Input schema" value={data.workflowRevision.inputSchema} />
          <JsonBlock title="Capability manifest" value={data.workflowRevision.capabilityManifest} />
          <JsonBlock title="Validation summary" value={data.workflowRevision.validationSummary} />
          <JsonBlock title="Node definition manifest" value={data.workflowRevision.nodeDefinitionManifest} />
        </div>
      </section>

      <footer className={styles.detailActions}>
        {data.status === "CHANGES_REQUESTED" ? (
          <>
            <Link to={`/publisher/projects/${snapshot.projectId}/draft`}><FiGitBranch /> Open project draft</Link>
            <Link className={styles.primaryLink} to={`/publisher/submissions/new?productId=${data.productId}`}>Create new submission <FiArrowRight /></Link>
          </>
        ) : null}
        {data.status === "APPROVED" ? (
          <Link className={styles.primaryLink} to={`/publisher/releases/${data.productId}?submissionId=${data.id}`}>View product releases <FiArrowRight /></Link>
        ) : null}
      </footer>
    </article>
  );
};

export default SubmissionDetail;
