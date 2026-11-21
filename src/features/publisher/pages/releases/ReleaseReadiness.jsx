import {
  FiAlertTriangle,
  FiCheck,
  FiCircle,
  FiExternalLink,
  FiPlay,
  FiRefreshCw,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import {
  buildActivationReadiness,
  isEligibleSubscriptionOffer,
} from "./model/releasePermissions";
import styles from "./ProductReleasesPage.module.css";

const Check = ({ ready, children }) => (
  <li className={ready ? styles.checkReady : styles.checkMissing}>
    {ready ? <FiCheck /> : <FiCircle />}
    <span>{children}</span>
  </li>
);

const getLifecycleStatus = (product, readiness) => {
  if (!product) {
    return { tone: "pending", icon: FiCircle, label: "Product status is loading" };
  }
  if (product.status === "ACTIVE") {
    return { tone: "live", icon: FiCheck, label: "Product is ACTIVE on Marketplace" };
  }
  if (product.status === "DRAFT") {
    return readiness.activatable
      ? { tone: "ready", icon: FiPlay, label: "Ready to activate — Product is currently DRAFT" }
      : { tone: "pending", icon: FiCircle, label: "Product is DRAFT — complete the gates above" };
  }
  if (product.status === "ARCHIVED") {
    return readiness.reactivatable
      ? { tone: "ready", icon: FiRefreshCw, label: "Ready to reactivate — Product is currently ARCHIVED" }
      : { tone: "pending", icon: FiCircle, label: "Product is ARCHIVED — complete the gates above" };
  }
  return {
    tone: "blocked",
    icon: FiAlertTriangle,
    label: "Product is SUSPENDED by an administrator",
  };
};

const ReleaseReadiness = ({
  product,
  currentRelease,
  loading,
  busy,
  action,
  onActivate,
  onReactivate,
}) => {
  const readiness = buildActivationReadiness({ product, currentRelease });
  const eligibleOfferCount = (product?.offers ?? []).filter(
    isEligibleSubscriptionOffer,
  ).length;
  const lifecycleStatus = getLifecycleStatus(product, readiness);
  const LifecycleIcon = lifecycleStatus.icon;
  const busyLabel = action?.startsWith("refresh")
    ? "Refreshing readiness…"
    : product?.status === "ARCHIVED"
      ? "Reactivating…"
      : "Activating…";
  return (
    <section className={styles.readinessPanel} aria-labelledby="activation-readiness-title">
      <header>
        <div>
          <p className={styles.eyebrow}>Marketplace gate</p>
          <h3 id="activation-readiness-title">Activation readiness</h3>
        </div>
        <span className={product?.status === "ACTIVE" ? styles.liveBadge : styles.draftBadge}>
          {product?.status === "ACTIVE" ? "LIVE" : product?.status ?? "LOADING"}
        </span>
      </header>
      {loading ? <p className={styles.muted}>Refreshing current release evidence…</p> : null}
      <dl className={styles.readinessEvidence}>
        <div>
          <dt>Current release</dt>
          <dd>{currentRelease ? `v${currentRelease.version}` : "Not selected"}</dd>
        </div>
        <div>
          <dt>Eligible subscription offers</dt>
          <dd>{eligibleOfferCount}</dd>
        </div>
      </dl>
      <ul className={styles.checkList}>
        <Check ready={readiness.releasePublished}>Current release is PUBLISHED</Check>
        <Check ready={readiness.packageComplete}>Release package is complete</Check>
        <Check ready={readiness.currentSelected}>Current release is explicitly selected</Check>
        <Check ready={readiness.subscriptionOffer}>At least one valid SUBSCRIPTION offer exists</Check>
      </ul>
      <p
        className={`${styles.lifecycleStatus} ${styles[`lifecycle${lifecycleStatus.tone}`]}`}
        role="status"
      >
        <LifecycleIcon />
        <span>{lifecycleStatus.label}</span>
      </p>
      {!readiness.subscriptionOffer && product ? (
        <Link className={styles.secondaryLink} to={`/publisher/products/${product.id}`}>
          Open Product & Offers <FiExternalLink />
        </Link>
      ) : null}
      {product?.status === "DRAFT" ? (
        <button
          type="button"
          className={styles.activateButton}
          disabled={!readiness.activatable || busy}
          onClick={onActivate}
          title={readiness.activatable ? "Activate this product on Marketplace" : "Complete every readiness gate before activation"}
        >
          {action?.startsWith("refresh") ? <FiRefreshCw /> : <FiPlay />}
          {busy ? busyLabel : "Activate product"}
        </button>
      ) : null}
      {product?.status === "SUSPENDED" ? <p className={styles.warning}>An administrator suspended this product. Publisher activation is unavailable.</p> : null}
      {product?.status === "ARCHIVED" ? (
        <>
          <p className={styles.muted}>Reactivation rechecks the latest current release and offers before the request is sent.</p>
          <button
            type="button"
            className={styles.activateButton}
            disabled={!readiness.reactivatable || busy}
            onClick={onReactivate}
            title={readiness.reactivatable ? "Reactivate this product on Marketplace" : "Complete every readiness gate before reactivation"}
          >
            {action?.startsWith("refresh") ? <FiRefreshCw /> : <FiPlay />}
            {busy ? busyLabel : "Reactivate product"}
          </button>
        </>
      ) : null}
    </section>
  );
};

export default ReleaseReadiness;
