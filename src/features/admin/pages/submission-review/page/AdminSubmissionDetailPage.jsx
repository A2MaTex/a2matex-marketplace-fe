import { useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiEdit3,
  FiRefreshCw,
  FiShield,
  FiSlash,
} from "react-icons/fi";
import { Link, useLocation, useParams } from "react-router-dom";
import { adminSubmissionApi } from "../api/adminSubmissionApi";
import ScanFindings from "../components/ScanFindings";
import ScanRetryDialog from "../components/ScanRetryDialog";
import ScanStatusBadge from "../components/ScanStatusBadge";
import ScanSummary from "../components/ScanSummary";
import SubmissionReviewDialog from "../components/SubmissionReviewDialog";
import SubmissionSnapshot from "../components/SubmissionSnapshot";
import SubmissionStatusBadge from "../components/SubmissionStatusBadge";
import SubmissionWorkflowPreview from "../components/SubmissionWorkflowPreview";
import { useAdminSubmission } from "../hooks/useAdminSubmission";
import { useNodeCatalog } from "@/features/publisher/pages/workflow/hooks/useNodeCatalog";
import { toAdminSubmissionError } from "../model/adminSubmissionError";
import { compactId, formatAdminSubmissionDate } from "../model/adminSubmissionPresentation";
import { isSubmissionUuid } from "../model/adminSubmissionQuery";
import { reviewEligibility } from "../model/adminSubmissionReview";
import styles from "./AdminSubmissionReview.module.css";

const DetailState = ({ error, onRetry }) => (
  <div className={styles.detailState} role={error ? "alert" : "status"}>
    <span>
      {error?.kind === "forbidden" ? (
        <FiShield />
      ) : error ? (
        <FiAlertTriangle />
      ) : (
        <span className={styles.largeSpinner} />
      )}
    </span>
    <h1>{error ? (error.kind === "forbidden" ? "Permission required" : "Submission unavailable") : "Loading evidence…"}</h1>
    <p>{error?.message ?? "Verifying the Admin projection and immutable snapshots."}</p>
    {error?.detail ? <code>{error.detail}</code> : null}
    {error && error.kind !== "forbidden" && onRetry ? (
      <button type="button" onClick={onRetry}><FiRefreshCw /> Try again</button>
    ) : null}
  </div>
);

export default function AdminSubmissionDetailPage() {
  const { submissionId } = useParams();
  const location = useLocation();
  const detail = useAdminSubmission(submissionId);
  const nodeCatalog = useNodeCatalog();
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const backTo =
    typeof location.state?.from === "string" && location.state.from.startsWith("/admin/submissions")
      ? location.state.from
      : "/admin/submissions";
  const eligibility = useMemo(() => reviewEligibility(detail.data), [detail.data]);

  if (!isSubmissionUuid(submissionId)) {
    return (
      <div className={styles.detailPage}>
        <Link className={styles.backLink} to="/admin/submissions"><FiArrowLeft /> Submission Review</Link>
        <DetailState error={{ kind: "not-found", message: "The submission ID is invalid." }} />
      </div>
    );
  }

  const closeDialog = () => {
    if (busy) return;
    setDialog(null);
    setActionError(null);
  };

  const retryScan = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await adminSubmissionApi.retryScan(submissionId);
      await detail.refetch();
      setDialog(null);
      setAnnouncement("Scan recovery request accepted. The server state has been refreshed.");
    } catch (error) {
      const mapped = toAdminSubmissionError(error, "Unable to recover this scan.");
      await detail.refetch();
      setActionError(mapped);
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async (request) => {
    setBusy(true);
    setActionError(null);
    try {
      await adminSubmissionApi.review(submissionId, request);
      await detail.refetch();
      setDialog(null);
      setAnnouncement(`Decision saved: ${request.decision.replaceAll("_", " ").toLowerCase()}.`);
    } catch (error) {
      const mapped = toAdminSubmissionError(error, "Unable to save this review decision.");
      if (mapped.uncertain || mapped.conflict) await detail.refetch();
      setActionError(mapped);
    } finally {
      setBusy(false);
    }
  };

  if (detail.loading && !detail.data) return <div className={styles.detailPage}><DetailState /></div>;
  if (detail.error || !detail.data) {
    return (
      <div className={styles.detailPage}>
        <Link className={styles.backLink} to={backTo}><FiArrowLeft /> Submission Review</Link>
        <DetailState error={detail.error} onRetry={detail.refetch} />
      </div>
    );
  }

  const submission = detail.data;
  const scanSummary = submission.scanResult?.summary ?? null;
  const terminal = ["APPROVED", "CHANGES_REQUESTED", "REJECTED"].includes(submission.status);

  return (
    <div className={styles.detailPage}>
      <div className={styles.detailTopbar}>
        <Link className={styles.backLink} to={backTo}><FiArrowLeft /> Back to submissions</Link>
        <button type="button" onClick={detail.refetch} disabled={detail.loading} aria-label="Refresh submission">
          <FiRefreshCw className={detail.loading ? styles.spinning : ""} />
        </button>
      </div>

      <header className={styles.detailHero}>
        <div className={styles.detailHeroMain}>
          <span className={styles.eyebrow}>Submission #{submission.number} · frozen evidence</span>
          <h1>{submission.productSnapshot.name}</h1>
          <p>{submission.productSnapshot.shortDescription}</p>
          <div><SubmissionStatusBadge status={submission.status} /><ScanStatusBadge status={submission.scanStatus} attempt={submission.scanAttempt} /></div>
        </div>
        <dl className={styles.heroMetadata}>
          <div><dt>Requested</dt><dd>v{submission.releaseRequest.version}</dd></div>
          <div><dt>Created</dt><dd>{formatAdminSubmissionDate(submission.createdAt)}</dd></div>
          <div><dt>Submission ID</dt><dd><code title={submission.id}>{compactId(submission.id)}</code></dd></div>
          <div><dt>Reviewer</dt><dd>{submission.updatedById ? <code title={submission.updatedById}>{compactId(submission.updatedById)}</code> : "Not reviewed"}</dd></div>
        </dl>
      </header>

      <p className={styles.srOnly} aria-live="polite">{announcement}</p>

      <div className={styles.detailColumns}>
        <div className={styles.evidenceColumn}>
          <section className={`${styles.panel} ${styles.scanPanel}`}>
            <header className={styles.panelHeader}>
              <span className={styles.panelIcon}><FiShield /></span>
              <div><p>Automated evidence</p><h2>Scanner report</h2></div>
              <small>{submission.scannerVersion || "Version unavailable"}</small>
            </header>
            <ScanSummary summary={scanSummary} />
            {scanSummary?.truncated ? (
              <div className={styles.truncatedNotice}><FiAlertTriangle /> The result was truncated by the scanner. Review available findings and do not assume omitted evidence passed.</div>
            ) : null}
            {submission.scanResult ? (
              <ScanFindings
                findings={submission.scanResult.findings}
                revision={submission.workflowRevision}
                submissionId={submission.id}
                catalog={nodeCatalog.data}
              />
            ) : (
              <div className={styles.noScanResult}>
                <FiClock />
                <div><strong>No completed scan result</strong><p>Status: {submission.scanStatus}. Scanner findings become available only after a completed business scan.</p></div>
              </div>
            )}
          </section>

          <SubmissionSnapshot submission={submission} />
          <SubmissionWorkflowPreview
            revision={submission.workflowRevision}
            submissionId={submission.id}
            catalogState={nodeCatalog}
          />

          {submission.reviewFeedback ? (
            <section className={`${styles.panel} ${styles.reviewResult}`}>
              <header className={styles.panelHeader}>
                <span className={styles.panelIcon}><FiEdit3 /></span>
                <div><p>Publisher-visible</p><h2>Previous review result</h2></div>
                <small>{formatAdminSubmissionDate(submission.reviewedAt)}</small>
              </header>
              <blockquote>{submission.reviewFeedback.summary}</blockquote>
              {submission.reviewFeedback.items.length ? (
                <ol>{submission.reviewFeedback.items.map((item, index) => (
                  <li key={`${item.nodeId ?? "general"}:${index}`}>
                    {item.nodeId ? <code>{item.nodeId}</code> : null}<span>{item.message}</span>
                  </li>
                ))}</ol>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className={styles.actionColumn} aria-label="Submission controls">
          <section className={styles.actionCard}>
            <span className={styles.actionOrb}><FiShield /></span>
            <p>Authoritative controls</p>
            <h2>{terminal ? "Review completed" : eligibility.canReview ? "Ready for your decision" : eligibility.canRetryScan ? "Scanner recovery available" : "Waiting for state change"}</h2>
            <p className={styles.actionDescription}>
              {terminal
                ? "This submission is read-only. Identical PUT replay is reserved for recovery, not exposed as a normal action."
                : "The backend rechecks permissions, scan state, Product eligibility and Publisher eligibility inside the transaction."}
            </p>

            {eligibility.canRetryScan ? (
              <button className={styles.retryButton} type="button" onClick={() => { setDialog("retry"); setActionError(null); }}>
                <FiRefreshCw />{submission.scanStatus === "QUEUED" ? "Republish scan job" : "Retry scan"}
              </button>
            ) : null}

            {eligibility.canReview ? (
              <div className={styles.reviewActions}>
                <button type="button" className={styles.approveButton} disabled={!eligibility.canApprove} onClick={() => { setDialog("APPROVE"); setActionError(null); }}>
                  <span className={styles.reviewActionIcon}><FiCheck /></span>
                  <span className={styles.reviewActionCopy}><strong>Approve release</strong><small>Accept the frozen evidence</small></span>
                  <FiChevronRight className={styles.reviewActionArrow} />
                </button>
                <button type="button" className={styles.requestChangesButton} onClick={() => { setDialog("REQUEST_CHANGES"); setActionError(null); }}>
                  <span className={styles.reviewActionIcon}><FiEdit3 /></span>
                  <span className={styles.reviewActionCopy}><strong>Request changes</strong><small>Return actionable feedback</small></span>
                  <FiChevronRight className={styles.reviewActionArrow} />
                </button>
                <button type="button" className={styles.rejectButton} onClick={() => { setDialog("REJECT"); setActionError(null); }}>
                  <span className={styles.reviewActionIcon}><FiSlash /></span>
                  <span className={styles.reviewActionCopy}><strong>Reject submission</strong><small>Close this review permanently</small></span>
                  <FiChevronRight className={styles.reviewActionArrow} />
                </button>
              </div>
            ) : null}
            {submission.scanStatus === "FAILED" && submission.status === "READY_FOR_REVIEW" ? (
              <small className={styles.disabledReason}>Approval is disabled because the business scan failed.</small>
            ) : null}
          </section>

          <section className={styles.identityCard}>
            <h3>Evidence identity</h3>
            <dl>
              <div><dt>Product</dt><dd><code title={submission.productId}>{compactId(submission.productId)}</code></dd></div>
              <div><dt>Publisher</dt><dd><code title={submission.productSnapshot.publisherAccountId}>{compactId(submission.productSnapshot.publisherAccountId)}</code></dd></div>
              <div><dt>Project</dt><dd><code title={submission.productSnapshot.projectId}>{compactId(submission.productSnapshot.projectId)}</code></dd></div>
              <div><dt>Created by</dt><dd><code title={submission.createdById}>{compactId(submission.createdById)}</code></dd></div>
            </dl>
          </section>
        </aside>
      </div>

      {dialog === "retry" ? (
        <ScanRetryDialog submission={submission} busy={busy} error={actionError} onConfirm={retryScan} onClose={closeDialog} />
      ) : null}
      {["APPROVE", "REQUEST_CHANGES", "REJECT"].includes(dialog) ? (
        <SubmissionReviewDialog
          submission={submission}
          initialDecision={dialog}
          eligibility={eligibility}
          busy={busy}
          error={actionError}
          onSubmit={submitReview}
          onClose={closeDialog}
        />
      ) : null}
    </div>
  );
}
