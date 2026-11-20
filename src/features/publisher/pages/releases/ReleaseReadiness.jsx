import { FiCheck, FiCircle, FiExternalLink, FiPlay } from "react-icons/fi";
import { Link } from "react-router-dom";
import { buildActivationReadiness } from "./model/releasePermissions";
import styles from "./ProductReleasesPage.module.css";

const Check = ({ ready, children }) => (
  <li className={ready ? styles.checkReady : styles.checkMissing}>
    {ready ? <FiCheck /> : <FiCircle />}
    <span>{children}</span>
  </li>
);

const ReleaseReadiness = ({ product, currentRelease, loading, busy, onActivate }) => {
  const readiness = buildActivationReadiness({ product, currentRelease });
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
      <ul className={styles.checkList}>
        <Check ready={readiness.releasePublished}>Current release is PUBLISHED</Check>
        <Check ready={readiness.packageComplete}>Release package is complete</Check>
        <Check ready={readiness.currentSelected}>Current release is explicitly selected</Check>
        <Check ready={readiness.subscriptionOffer}>At least one valid SUBSCRIPTION offer exists</Check>
        <Check ready={readiness.productActive}>Product is ACTIVE on Marketplace</Check>
      </ul>
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
          <FiPlay /> {busy ? "Activating…" : "Activate product"}
        </button>
      ) : null}
      {product?.status === "SUSPENDED" ? <p className={styles.warning}>An administrator suspended this product. Publisher activation is unavailable.</p> : null}
      {product?.status === "ARCHIVED" ? <p className={styles.warning}>Archived products are read-only and cannot be activated.</p> : null}
    </section>
  );
};

export default ReleaseReadiness;
