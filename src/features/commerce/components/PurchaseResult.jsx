import { FiCheck, FiClock, FiHash } from "react-icons/fi";
import { formatVndAmount } from "../model/money";
import styles from "./PurchaseConfirmationDialog.module.css";

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function PurchaseResult({ result, profileRefreshFailed }) {
  return (
    <div className={styles.result} role="status" aria-live="polite">
      <span className={styles.successMark} aria-hidden="true">
        <FiCheck />
      </span>
      <div>
        <span className={styles.resultEyebrow}>Purchase complete</span>
        <h3>Your access is ready</h3>
        <p>
          The server confirmed the order and created your entitlement. No
          additional checkout step is required.
        </p>
      </div>

      <dl className={styles.resultDetails}>
        <div>
          <dt><FiHash aria-hidden="true" /> Order ID</dt>
          <dd>{result.id}</dd>
        </div>
        <div>
          <dt>Amount paid</dt>
          <dd>{formatVndAmount(result.totalAmount)}</dd>
        </div>
        <div>
          <dt>Access status</dt>
          <dd><span className={styles.activeBadge}>{result.entitlement.status}</span></dd>
        </div>
        <div>
          <dt><FiClock aria-hidden="true" /> Starts</dt>
          <dd>{formatDateTime(result.entitlement.startsAt)}</dd>
        </div>
        <div>
          <dt>Expires</dt>
          <dd>
            {result.entitlement.expiresAt
              ? formatDateTime(result.entitlement.expiresAt)
              : "Lifetime"}
          </dd>
        </div>
      </dl>

      {profileRefreshFailed ? (
        <p className={styles.refreshWarning} role="alert">
          Purchase succeeded, but the balance display could not refresh. It
          will update the next time your profile loads.
        </p>
      ) : null}
    </div>
  );
}
