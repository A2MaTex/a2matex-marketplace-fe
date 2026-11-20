import { useEffect, useState } from "react";
import { FiBox, FiMaximize2, FiX } from "react-icons/fi";
import {
  buildMarketplaceImageUrl,
  selectMarketplaceMedia,
} from "../utils/marketplaceMedia";
import styles from "./ProductMediaGallery.module.css";

export default function ProductMediaGallery({ media, productName }) {
  const visuals = selectMarketplaceMedia(media).detailVisuals;
  const [selectedId, setSelectedId] = useState(visuals[0]?.id ?? null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [failedIds, setFailedIds] = useState(() => new Set());
  const selected = visuals.find((item) => item.id === selectedId) ?? visuals[0] ?? null;

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen]);

  const markFailed = (staticId) => {
    setFailedIds((current) => new Set(current).add(staticId));
  };

  if (!selected) {
    return (
      <div className={styles.empty} aria-label="No product media available">
        <FiBox aria-hidden="true" />
        <span>Preview coming soon</span>
      </div>
    );
  }

  const selectedFailed = failedIds.has(selected.staticId);
  const selectedAlt = selected.altText ?? `${productName} preview`;

  return (
    <div className={styles.gallery}>
      <button
        type="button"
        className={styles.mainVisual}
        onClick={() => !selectedFailed && setLightboxOpen(true)}
        disabled={selectedFailed}
        aria-label={`Open large preview: ${selectedAlt}`}
      >
        {selectedFailed ? (
          <span className={styles.fallback}>
            <FiBox aria-hidden="true" /> Image unavailable
          </span>
        ) : (
          <img
            src={buildMarketplaceImageUrl(selected.staticId, "medium")}
            alt={selectedAlt}
            onError={() => markFailed(selected.staticId)}
          />
        )}
        {!selectedFailed ? (
          <span className={styles.expandHint}>
            <FiMaximize2 aria-hidden="true" /> Enlarge
          </span>
        ) : null}
      </button>

      {visuals.length > 1 ? (
        <div className={styles.thumbnails} aria-label="Product previews">
          {visuals.map((item, index) => {
            const failed = failedIds.has(item.staticId);
            return (
              <button
                key={item.id}
                type="button"
                className={item.id === selected.id ? styles.activeThumb : styles.thumb}
                onClick={() => setSelectedId(item.id)}
                aria-label={`Show preview ${index + 1}`}
                aria-pressed={item.id === selected.id}
              >
                {failed ? (
                  <FiBox aria-hidden="true" />
                ) : (
                  <img
                    src={buildMarketplaceImageUrl(item.staticId, "small")}
                    alt=""
                    loading="lazy"
                    onError={() => markFailed(item.staticId)}
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : null}

      {lightboxOpen && !selectedFailed ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} large preview`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLightboxOpen(false);
          }}
        >
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setLightboxOpen(false)}
            aria-label="Close preview"
          >
            <FiX aria-hidden="true" />
          </button>
          <img
            src={buildMarketplaceImageUrl(selected.staticId, "large")}
            alt={selectedAlt}
            onError={() => {
              markFailed(selected.staticId);
              setLightboxOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
