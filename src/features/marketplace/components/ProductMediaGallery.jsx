import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [failedVariants, setFailedVariants] = useState(() => new Set());
  const mainVisualRef = useRef(null);
  const closeButtonRef = useRef(null);
  const selected = visuals.find((item) => item.id === selectedId) ?? visuals[0] ?? null;

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const mainVisual = mainVisualRef.current;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setLightboxOpen(false);
    };

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      mainVisual?.focus();
    };
  }, [lightboxOpen]);

  const hasFailed = (staticId, variant) =>
    failedVariants.has(`${staticId}:${variant}`);

  const markFailed = (staticId, variant) => {
    setFailedVariants((current) => new Set(current).add(`${staticId}:${variant}`));
  };

  if (!selected) {
    return (
      <div className={styles.empty} aria-label="No product media available">
        <FiBox aria-hidden="true" />
        <span>Preview coming soon</span>
      </div>
    );
  }

  const selectedFailed = hasFailed(selected.staticId, "large");
  const selectedAlt = selected.altText ?? `${productName} preview`;

  const lightbox = lightboxOpen
    ? createPortal(
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} large preview`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setLightboxOpen(false);
          }}
        >
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={() => setLightboxOpen(false)}
            aria-label="Close preview"
            title="Close preview"
          >
            <FiX aria-hidden="true" />
          </button>
          {selectedFailed ? (
            <span className={styles.lightboxFallback} role="status">
              <FiBox aria-hidden="true" /> Full-size image unavailable
            </span>
          ) : (
            <img
              className={styles.lightboxImage}
              src={buildMarketplaceImageUrl(selected.staticId, "large")}
              alt={selectedAlt}
              loading="eager"
              decoding="async"
              onError={() => markFailed(selected.staticId, "large")}
            />
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={styles.gallery}>
      <button
        ref={mainVisualRef}
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
            src={buildMarketplaceImageUrl(selected.staticId, "large")}
            alt={selectedAlt}
            onError={() => markFailed(selected.staticId, "large")}
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
            const failed = hasFailed(item.staticId, "small");
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
                    onError={() => markFailed(item.staticId, "small")}
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : null}

      {lightbox}
    </div>
  );
}
