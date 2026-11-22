import { Link } from "react-router-dom";
import { FiAlertTriangle, FiBox, FiLogIn, FiRefreshCw } from "react-icons/fi";
import styles from "./CommercePages.module.css";

export function CommerceLoading({ label = "Loading" }) {
  return (
    <div className={styles.loadingGrid} aria-busy="true" aria-label={label}>
      {[0, 1, 2].map((item) => (
        <div className={styles.skeletonCard} key={item}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export function CommerceEmpty({ title, message, actionLabel, actionTo = "/" }) {
  return (
    <div className={styles.stateCard}>
      <span className={styles.stateIcon}><FiBox aria-hidden="true" /></span>
      <h2>{title}</h2>
      <p>{message}</p>
      <Link to={actionTo}>{actionLabel}</Link>
    </div>
  );
}

export function CommerceError({ error, onRetry, returnTo }) {
  const unauthorized = error?.status === 401;
  const forbidden = error?.status === 403;
  const notFound = error?.status === 404;
  return (
    <div className={styles.stateCard} role="alert">
      <span className={`${styles.stateIcon} ${styles.errorIcon}`}>
        <FiAlertTriangle aria-hidden="true" />
      </span>
      <h2>
        {forbidden
          ? "Access denied"
          : unauthorized
            ? "Sign in required"
            : notFound
              ? "Order unavailable"
              : "Unable to load"}
      </h2>
      <p>{error?.message ?? "The requested data could not be loaded."}</p>
      {unauthorized ? (
        <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`}>
          <FiLogIn aria-hidden="true" /> Sign in
        </Link>
      ) : onRetry && !forbidden ? (
        <button type="button" onClick={onRetry}>
          <FiRefreshCw aria-hidden="true" /> Try again
        </button>
      ) : (
        <Link to="/">Back to Marketplace</Link>
      )}
    </div>
  );
}
