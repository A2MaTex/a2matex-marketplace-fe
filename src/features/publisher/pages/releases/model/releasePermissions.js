const MUTABLE_PRODUCT_STATUSES = new Set(["DRAFT", "ACTIVE"]);

export const isReleasePackageComplete = (release) =>
  Boolean(release?.packageHash && release?.downloadUrl);

export const releaseSelectionReason = ({ release, product }) => {
  if (!release || !product) return "Release and product details are still loading.";
  if (!MUTABLE_PRODUCT_STATUSES.has(product.status)) {
    return `${product.status} products are read-only.`;
  }
  if (release.productId !== product.id) return "This release belongs to another product.";
  if (release.isCurrent || product.currentReleaseId === release.id) {
    return "This is already the current release.";
  }
  if (release.status !== "PUBLISHED") return "Only published releases can be selected.";
  if (release.disabledAt) return "Disabled releases cannot be selected.";
  if (!isReleasePackageComplete(release)) return "The release package is incomplete.";
  return null;
};

export const hasEligibleSubscriptionOffer = (offers = []) =>
  offers.some(
    (offer) =>
      offer.type === "SUBSCRIPTION" &&
      /^\d+$/.test(offer.priceAmount) &&
      BigInt(offer.priceAmount) > 0n &&
      Number.isInteger(offer.durationDays) &&
      offer.durationDays > 0,
  );

export const buildActivationReadiness = ({ product, currentRelease }) => {
  const releasePublished = currentRelease?.status === "PUBLISHED";
  const packageComplete = isReleasePackageComplete(currentRelease);
  const currentSelected = Boolean(
    product?.currentReleaseId && currentRelease?.id === product.currentReleaseId,
  );
  const subscriptionOffer = hasEligibleSubscriptionOffer(product?.offers);
  const productActive = product?.status === "ACTIVE";
  const activatable = Boolean(
    product?.status === "DRAFT" &&
      releasePublished &&
      packageComplete &&
      currentSelected &&
      subscriptionOffer,
  );
  return {
    releasePublished,
    packageComplete,
    currentSelected,
    subscriptionOffer,
    productActive,
    activatable,
  };
};
