import { API_BASE_URL } from "../../../lib/apiBaseUrl.js";

const IMAGE_VARIANTS = new Set(["small", "medium", "large"]);

export const buildMarketplaceImageUrl = (staticId, variant) => {
  if (typeof staticId !== "string" || staticId.length === 0) {
    throw new TypeError("staticId must be a non-empty string.");
  }
  if (!IMAGE_VARIANTS.has(variant)) {
    throw new TypeError("Image variant must be small, medium, or large.");
  }

  return `${API_BASE_URL}/statics/images/${encodeURIComponent(staticId)}?variant=${variant}`;
};

const bySortOrder = (left, right) => left.sortOrder - right.sortOrder;

export const selectMarketplaceMedia = (media = []) => {
  const sorted = [...media].sort(bySortOrder);
  const icon = sorted.find((item) => item.type === "ICON") ?? null;
  const cover = sorted.find((item) => item.type === "COVER") ?? null;
  const gallery = sorted.filter((item) => item.type === "GALLERY");

  return {
    icon,
    cover,
    gallery,
    cardVisual: cover ?? icon,
    detailVisuals: cover ? [cover, ...gallery] : gallery.length ? gallery : icon ? [icon] : [],
  };
};
