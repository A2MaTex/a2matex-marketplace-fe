import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { Link, useLocation, useParams } from "react-router-dom";
import { formatCommerceDate } from "@/features/commerce/model/date";
import { formatVndAmount } from "@/features/commerce/model/money";
import SafeProductContent from "@/features/marketplace/components/SafeProductContent";
import { buildMarketplaceImageUrl } from "@/features/marketplace/utils/marketplaceMedia";
import { ErrorState, LoadingState } from "../components/GovernanceState";
import AdminProductImage from "../components/AdminProductImage";
import ProductModerationDialog from "../components/ProductModerationDialog";
import StatusBadge from "../components/StatusBadge";
import {
  useAdminProduct,
  useAdminProductPublisher,
  useAdminProductRelease,
} from "../hooks/useAdminProductGovernance";
import styles from "./AdminProductGovernance.module.css";

const display = (value) => value || <span className={styles.muted}>—</span>;

export default function AdminProductDetailPage() {
  const { productId } = useParams();
  const location = useLocation();
  const productState = useAdminProduct(productId);
  const currentReleaseState = useAdminProductRelease(
    productId,
    productState.data?.currentReleaseId,
    { enabled: Boolean(productState.data?.currentReleaseId) },
  );
  const publisherState = useAdminProductPublisher(
    productState.data?.publisherAccountId,
    { enabled: Boolean(productState.data?.publisherAccountId) },
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const product = productState.data;
  const backTo = location.state?.from || "/admin/products";

  if (productState.loading) return <LoadingState label="Loading Product…" />;
  if (productState.error)
    return (
      <ErrorState error={productState.error} onRetry={productState.refetch} />
    );
  if (!product) return null;

  const canModerate =
    product.status === "ACTIVE" || product.status === "SUSPENDED";
  const handleSuccess = (message) => {
    setDialogOpen(false);
    setAnnouncement(message);
    productState.refetch();
    currentReleaseState.refetch();
  };

  return (
    <div className={styles.detailPage}>
      <Link to={backTo} className={styles.backLink}>
        ← Back to Products
      </Link>
      <div className={styles.srOnly} role="status" aria-live="polite">
        {announcement}
      </div>
      <section className={styles.hero}>
        <div className={styles.heroIdentity}>
          <AdminProductImage product={product} size="medium" />
          <div className={styles.heroMain}>
            <span className={styles.eyebrow}>Released Product</span>
            <h1>{product.name || "Untitled Product"}</h1>
            <div className={styles.statusRow}>
              <StatusBadge status={product.status} />
              {currentReleaseState.data ? (
                <span className={styles.releaseVersion}>
                  Version {currentReleaseState.data.version}
                </span>
              ) : null}
            </div>
            <p>
              {product.shortDescription ||
                "No short description has been supplied."}
            </p>
          </div>
        </div>
        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={productState.refetch}
          >
            <FiRefreshCw aria-hidden="true" /> Refresh
          </button>
          {canModerate ? (
            <button
              type="button"
              className={
                product.status === "ACTIVE"
                  ? styles.dangerButton
                  : styles.primaryButton
              }
              onClick={() => setDialogOpen(true)}
            >
              {product.status === "ACTIVE"
                ? "Suspend Product"
                : "Reactivate Product"}
            </button>
          ) : null}
        </div>
      </section>

      <nav className={styles.tabs} aria-label="Product sections">
        <Link
          className={`${styles.tab} ${styles.tabActive}`}
          to={`/admin/products/${product.id}`}
        >
          Overview
        </Link>
        <Link
          className={styles.tab}
          to={`/admin/products/${product.id}/releases`}
          state={{ productListFrom: backTo }}
        >
          Releases
        </Link>
      </nav>

      {product.status === "SUSPENDED" && product.statusReason ? (
        <section className={styles.reason} aria-label="Suspension reason">
          <strong>Suspension reason</strong>
          <br />
          {product.statusReason}
        </section>
      ) : null}

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Identity &amp; ownership</h2>
          <dl className={styles.definitionGrid}>
            <div>
              <dt>Slug</dt>
              <dd>{display(product.slug)}</dd>
            </div>
            <div>
              <dt>Publisher</dt>
              <dd>
                <Link to={`/admin/publishers/${product.publisherAccountId}`}>
                  {publisherState.data?.profile?.fullName ||
                    publisherState.data?.user?.username ||
                    "Publisher unavailable"}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Project</dt>
              <dd>{product.project.name || "Untitled project"}</dd>
            </div>
            <div>
              <dt>Project status</dt>
              <dd>{product.project.status}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>
                {formatCommerceDate(product.createdAt, { withTime: true })}
              </dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>
                {formatCommerceDate(product.updatedAt, { withTime: true })}
              </dd>
            </div>
            <div className={styles.fullWidth}>
              <dt>Current release</dt>
              <dd>
                {currentReleaseState.data ? (
                  <Link
                    to={`/admin/products/${product.id}/releases/${currentReleaseState.data.id}`}
                  >
                    v{currentReleaseState.data.version}
                  </Link>
                ) : currentReleaseState.loading ? (
                  "Loading release…"
                ) : (
                  "Release unavailable"
                )}
              </dd>
            </div>
            {product.suspendedAt ? (
              <div>
                <dt>Suspended at</dt>
                <dd>
                  {formatCommerceDate(product.suspendedAt, { withTime: true })}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className={styles.card}>
          <h2>Offers</h2>
          {product.offers.length ? (
            <div className={styles.offerList}>
              {product.offers.map((offer) => (
                <div className={styles.offer} key={offer.id}>
                  <div>
                    <strong>
                      {offer.type === "SUBSCRIPTION"
                        ? "Subscription"
                        : "One-time"}
                    </strong>
                    <br />
                    <span>
                      {offer.durationDays
                        ? `${offer.durationDays} days`
                        : "Permanent"}
                    </span>
                  </div>
                  <strong>{formatVndAmount(offer.priceAmount)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.muted}>No offers are configured.</p>
          )}
        </section>

        <section className={`${styles.card} ${styles.cardWide}`}>
          <h2>Product content</h2>
          <dl className={styles.definitionGrid}>
            <div className={styles.fullWidth}>
              <dt>Description</dt>
              <dd>
                {product.description ? (
                  <SafeProductContent
                    value={product.description}
                    className={styles.richContent}
                  />
                ) : (
                  <span className={styles.muted}>—</span>
                )}
              </dd>
            </div>
            <div className={styles.fullWidth}>
              <dt>Usage instructions</dt>
              <dd>
                {product.usageInstructions ? (
                  <SafeProductContent
                    value={product.usageInstructions}
                    className={styles.richContent}
                  />
                ) : (
                  <span className={styles.muted}>—</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className={`${styles.card} ${styles.cardWide}`}>
          <h2>Media</h2>
          {product.media.length ? (
            <div className={styles.mediaGrid}>
              {[...product.media]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((media) => (
                  <figure className={styles.mediaItem} key={media.id}>
                    <img
                      src={buildMarketplaceImageUrl(media.staticId, "medium")}
                      alt={media.altText || `${media.type.toLowerCase()} media`}
                    />
                    <div>
                      <strong>{media.type}</strong>
                      <small>{media.altText || "No alternative text"}</small>
                    </div>
                  </figure>
                ))}
            </div>
          ) : (
            <p className={styles.muted}>No Product media.</p>
          )}
        </section>
      </div>

      {dialogOpen ? (
        <ProductModerationDialog
          product={product}
          currentRelease={currentReleaseState.data}
          currentReleaseLoading={currentReleaseState.loading}
          onClose={() => setDialogOpen(false)}
          onSuccess={handleSuccess}
          onVerify={() => {
            productState.refetch();
            currentReleaseState.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
