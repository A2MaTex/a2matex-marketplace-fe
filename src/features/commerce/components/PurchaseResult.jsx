import { FiCheck, FiClock } from "react-icons/fi";
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
        <h3>Purchase confirmed</h3>
        <p>
          The server confirmed your paid order. You can check the product in
          My Products.
        </p>
      </div>

      <dl className={styles.resultDetails}>
        <div>
          <dt>Amount paid</dt>
          <dd>{formatVndAmount(result.totalAmount)}</dd>
        </div>
        {result.entitlement ? (
          <>
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
          </>
        ) : (
          <div>
            <dt>Payment status</dt>
            <dd><span className={styles.activeBadge}>PAID</span></dd>
          </div>
        )}
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
