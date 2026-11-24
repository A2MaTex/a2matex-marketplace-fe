import { useEffect, useMemo, useState } from "react";
import { FiBox } from "react-icons/fi";
import {
  buildMarketplaceImageUrl,
  selectMarketplaceMedia,
} from "@/features/marketplace/utils/marketplaceMedia";
import styles from "../page/AdminProductGovernance.module.css";

export default function AdminProductImage({ product, size = "small" }) {
  const [failed, setFailed] = useState(false);
  const visual = useMemo(() => {
    const selected = selectMarketplaceMedia(product.media);
    return selected.icon || selected.cardVisual;
  }, [product.media]);
  const imageUrl = visual
    ? buildMarketplaceImageUrl(visual.staticId, size)
    : null;

  useEffect(() => {
    queueMicrotask(() => setFailed(false));
  }, [imageUrl]);

  return (
    <span className={styles.productIcon} aria-hidden="true">
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <FiBox />
      )}
    </span>
  );
}
