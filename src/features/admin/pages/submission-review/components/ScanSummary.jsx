import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiList } from "react-icons/fi";
import styles from "../page/AdminSubmissionReview.module.css";

export default function ScanSummary({ summary, compact = false }) {
  if (!summary) {
    return <span className={styles.unavailable}>Evidence unavailable</span>;
  }
  return (
    <div className={`${styles.scanSummary} ${compact ? styles.scanSummaryCompact : ""}`}>
      <span title="Rules evaluated"><FiList />{summary.totalRules}</span>
      <span className={styles.summaryPassed} title="Passed rules"><FiCheckCircle />{summary.passed}</span>
      <span className={styles.summaryWarnings} title="Warnings"><FiAlertTriangle />{summary.warnings}</span>
      <span className={styles.summaryErrors} title="Errors"><FiAlertCircle />{summary.errors}</span>
      {summary.truncated ? <strong title="The scanner truncated its findings">Truncated</strong> : null}
    </div>
  );
}
