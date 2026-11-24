import { FiRefreshCw, FiSend } from "react-icons/fi";
import AdminSubmissionDialog from "./AdminSubmissionDialog";
import styles from "../page/AdminSubmissionReview.module.css";

export default function ScanRetryDialog({ submission, busy, error, onConfirm, onClose }) {
  const republish = submission.scanStatus === "QUEUED";
  return (
    <AdminSubmissionDialog
      title={republish ? "Republish queued scan" : "Retry technical scan"}
      description={
        republish
          ? "The current scan attempt will be published again without creating a new attempt."
          : "A new scan attempt will be created from the same immutable workflow revision."
      }
      busy={busy}
      onClose={onClose}
    >
      <div className={styles.dialogBody}>
        <div className={styles.retryVisual}><span><FiRefreshCw /></span><i /><span><FiSend /></span></div>
        <dl className={styles.dialogFacts}>
          <div><dt>Submission</dt><dd>#{submission.number}</dd></div>
          <div><dt>Current attempt</dt><dd>{submission.scanAttempt}</dd></div>
          <div><dt>Next attempt</dt><dd>{republish ? submission.scanAttempt : submission.scanAttempt + 1}</dd></div>
        </dl>
        <p className={styles.dialogNotice}>
          If publication has an uncertain outcome, this page will refresh the authoritative server state before another retry is offered.
        </p>
        {error ? <div className={styles.dialogError} role="alert">{error.message}</div> : null}
      </div>
      <footer className={styles.dialogFooter}>
        <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className={styles.primaryButton} onClick={onConfirm} disabled={busy}>
          {busy ? <span className={styles.buttonSpinner} /> : <FiRefreshCw />}
          {busy ? "Sending…" : republish ? "Republish attempt" : "Start next attempt"}
        </button>
      </footer>
    </AdminSubmissionDialog>
  );
}
