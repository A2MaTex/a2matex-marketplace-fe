import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBox,
  FiCalendar,
  FiChevronRight,
  FiCode,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";
import LicenseTier from "../../components/LicenseTier";
import PricingPanel from "../../components/PricingPanel";
import ProductMediaGallery from "../../components/ProductMediaGallery";
import SafeProductContent from "../../components/SafeProductContent";
import { useMarketplaceProduct } from "../../hooks/useMarketplaceProduct";
import { isUuid } from "../../model/marketplaceContract";
import {
  buildMarketplaceImageUrl,
  selectMarketplaceMedia,
} from "../../utils/marketplaceMedia";
import styles from "./ProductDetailPage.module.css";

const formatPublishedDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Publication date unavailable";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const findDefaultOffer = (product) =>
  product.offers.find(
    (offer) =>
      offer.type === "SUBSCRIPTION" &&
      offer.priceAmount === product.minimumSubscriptionOffer.priceAmount &&
      offer.durationDays === product.minimumSubscriptionOffer.durationDays,
  ) ?? product.offers[0] ?? null;

function ProductIcon({ product }) {
  const [failed, setFailed] = useState(false);
  const icon = selectMarketplaceMedia(product.media).icon;
  if (!icon || failed) return <FiBox aria-hidden="true" />;
  return (
    <img
      src={buildMarketplaceImageUrl(icon.staticId, "small")}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}

function DetailState({ title, message, retryable, onRetry }) {
  return (
    <main className={styles.statePage}>
      <div className={styles.stateCard} role="alert">
        <FiAlertTriangle aria-hidden="true" />
        <h1>{title}</h1>
        <p>{message}</p>
        <div className={styles.stateActions}>
          <Link to="/"><FiArrowLeft aria-hidden="true" /> Marketplace</Link>
          {retryable ? (
            <button type="button" onClick={onRetry}>
              <FiRefreshCw aria-hidden="true" /> Try again
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default function ProductDetailPage() {
  const { productId = "" } = useParams();
  const validProductId = isUuid(productId);
  const { data: product, loading, error, refetch } = useMarketplaceProduct(
    validProductId ? productId : null,
  );
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  useEffect(() => {
    const previousTitle = document.title;
    if (product) document.title = `${product.name} · A2MaTeX Marketplace`;
    return () => {
      document.title = previousTitle;
    };
  }, [product]);

  if (!validProductId) {
    return (
      <DetailState
        title="Invalid product link"
        message="This marketplace link does not contain a valid product identifier."
        retryable={false}
      />
    );
  }

  if (loading && !product) {
    return (
      <main className={styles.page} aria-busy="true" aria-label="Loading product">
        <div className={styles.container}>
          <div className={styles.loadingLine} />
          <div className={styles.loadingLayout}>
            <div className={styles.loadingMain} />
            <div className={styles.loadingSide} />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    const notFound = error?.status === 404 || error?.code === "Error.ProductNotFound";
    return (
      <DetailState
        title={notFound ? "Product unavailable" : "Unable to load product"}
        message={error?.message ?? "This product is not available in the marketplace."}
        retryable={Boolean(error?.retryable)}
        onRetry={refetch}
      />
    );
  }

  const defaultOffer = findDefaultOffer(product);
  const selectedOffer =
    product.offers.find((offer) => offer.id === selectedOfferId) ?? defaultOffer;
  const publishedAt = formatPublishedDate(product.currentRelease.publishedAt);

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/">Marketplace</Link>
          <FiChevronRight aria-hidden="true" />
          <span aria-current="page">{product.name}</span>
        </nav>

        <header className={styles.heroCard}>
          <div className={styles.productIcon}><ProductIcon product={product} /></div>
          <div className={styles.heroCopy}>
            <div className={styles.badges}>
              <span>v{product.currentRelease.version}</span>
              <span className={styles.publicBadge}>Published</span>
            </div>
            <h1>{product.name}</h1>
            <p>{product.shortDescription}</p>
            <div className={styles.metaRow}>
              <Link
                className={styles.publisherLink}
                to={`/publishers/${encodeURIComponent(product.publisher.username)}`}
              >
                <FiUser aria-hidden="true" /> {product.publisher.displayName}{" "}
                <small>@{product.publisher.username}</small>
              </Link>
              <span><FiCalendar aria-hidden="true" /> {publishedAt}</span>
            </div>
          </div>
        </header>

        <div className={selectedOffer ? styles.layout : styles.singleLayout}>
          <div className={styles.mainColumn}>
            <ProductMediaGallery media={product.media} productName={product.name} />

            <section className={styles.requirements} aria-labelledby="requirements-heading">
              <div className={styles.sectionHeading}>
                <span>Compatibility</span>
                <h2 id="requirements-heading">Release requirements</h2>
              </div>
              <div className={styles.requirementGrid}>
                <div><FiCode aria-hidden="true" /><span>Launcher</span><strong>{product.currentRelease.minimumLauncherVersion}+</strong></div>
                <div><FiCode aria-hidden="true" /><span>Runtime</span><strong>{product.currentRelease.minimumRuntimeVersion}+</strong></div>
              </div>
            </section>

            <section className={styles.contentCard} aria-labelledby="description-heading">
              <div className={styles.sectionHeading}>
                <span>About this product</span>
                <h2 id="description-heading">Description</h2>
              </div>
              <SafeProductContent value={product.description} className={styles.richContent} />
            </section>

            {product.usageInstructions?.trim() ? (
              <section className={styles.contentCard} aria-labelledby="usage-heading">
                <div className={styles.sectionHeading}>
                  <span>Getting started</span>
                  <h2 id="usage-heading">Usage instructions</h2>
                </div>
                <SafeProductContent value={product.usageInstructions} className={styles.richContent} />
              </section>
            ) : null}

            {product.offers.length > 0 ? (
              <section className={styles.offerCard} aria-label="Product offers">
                <LicenseTier
                  offers={product.offers}
                  selectedOfferId={selectedOffer.id}
                  onSelect={setSelectedOfferId}
                />
              </section>
            ) : (
              <section className={styles.contentCard}>
                <h2>No public offers</h2>
                <p className={styles.muted}>The publisher has not made an access offer available.</p>
              </section>
            )}
          </div>

          {selectedOffer ? (
            <div className={styles.sidebar}><PricingPanel offer={selectedOffer} /></div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
