import {
  ADMIN_SUBMISSION_STATUSES,
} from "../model/adminSubmissionQuery";
import { SUBMISSION_STATUS_LABELS } from "../model/adminSubmissionPresentation";
import styles from "../page/AdminSubmissionReview.module.css";

export default function AdminSubmissionFilters({ query, disabled, onChange }) {
  return (
    <section className={styles.filters} aria-label="Submission filters">
      <header className={styles.filterHeading}>
        <div><span>Queue filters</span></div>
      </header>
      <div className={styles.filterControls}>
        <div className={styles.statusFilter}>
          <span>Review status</span>
          <div className={styles.statusTabs} role="group" aria-label="Review status">
            <button
              type="button"
              className={!query.status ? styles.activeTab : ""}
              onClick={() => onChange({ status: "" })}
              disabled={disabled}
            >
              All
            </button>
            {ADMIN_SUBMISSION_STATUSES.map((status) => (
              <button
                type="button"
                key={status}
                className={query.status === status ? styles.activeTab : ""}
                onClick={() => onChange({ status })}
                disabled={disabled}
              >
                {SUBMISSION_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
