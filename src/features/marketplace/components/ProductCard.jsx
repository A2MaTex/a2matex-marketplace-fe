import { useState } from "react";
import { Link } from "react-router-dom";
import { FiBox, FiCalendar, FiLayers } from "react-icons/fi";
import styles from "./ProductCard.module.css";
import { formatMinimumOffer } from "../utils/formatVnd";
import {
  buildMarketplaceImageUrl,
  selectMarketplaceMedia,
} from "../utils/marketplaceMedia";

const formatReleaseDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const ProductCard = ({ product }) => {
  const [failedVisualIds, setFailedVisualIds] = useState(() => new Set());
  const [iconFailed, setIconFailed] = useState(false);
  const { cardVisuals, icon } = selectMarketplaceMedia(product.media);
  const visual = cardVisuals.find((item) => !failedVisualIds.has(item.id)) ?? null;
  const visualUrl = visual
    ? buildMarketplaceImageUrl(visual.staticId, "medium")
    : null;
  const iconUrl = icon
    ? buildMarketplaceImageUrl(icon.staticId, "small")
    : null;
  const publishedAt = formatReleaseDate(product.currentRelease.publishedAt);

  return (
    <article className={styles.card}>
      <Link
        className={styles.cardLink}
        to={`/products/${product.id}`}
        aria-label={`View ${product.name}`}
      />

      <div className={styles.visual}>
        {visualUrl ? (
          <img
            src={visualUrl}
            alt={visual.altText ?? product.name}
            loading="lazy"
            decoding="async"
            onError={() => {
              setFailedVisualIds((current) => new Set(current).add(visual.id));
            }}
          />
        ) : (
          <div className={styles.visualFallback} aria-hidden="true">
            <FiBox />
          </div>
        )}
        <span className={styles.version}>v{product.currentRelease.version}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.publisherRow}>
          <Link
            className={styles.publisherLink}
            to={`/publishers/${encodeURIComponent(product.publisher.username)}`}
          >
            {product.publisher.displayName}
          </Link>
          {publishedAt ? (
            <span className={styles.releaseDate}>
              <FiCalendar aria-hidden="true" /> {publishedAt}
            </span>
          ) : null}
        </div>
        <div className={styles.productSummary}>
          <div className={styles.productIcon} aria-hidden="true">
            {iconUrl && !iconFailed ? (
              <img
                src={iconUrl}
                alt=""
                loading="lazy"
                decoding="async"
                onError={() => setIconFailed(true)}
              />
            ) : (
              <FiBox />
            )}
          </div>
          <div className={styles.productCopy}>
            <h2 className={styles.title}>{product.name}</h2>
            <p className={styles.desc}>{product.shortDescription}</p>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.priceBlock}>
          <span className={styles.priceLabel}>Subscription</span>
          <strong>{formatMinimumOffer(product.minimumSubscriptionOffer)}</strong>
        </div>
        <span className={styles.detailsLabel}>
          <FiLayers aria-hidden="true" /> View details
        </span>
      </footer>
    </article>
  );
};

export default ProductCard;
