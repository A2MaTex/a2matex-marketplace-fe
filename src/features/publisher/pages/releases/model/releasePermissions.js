const RELEASE_SELECTABLE_PRODUCT_STATUSES = new Set(["DRAFT", "ACTIVE", "ARCHIVED"]);

export const isReleasePackageComplete = (release) =>
  Boolean(release?.packageHash && release?.downloadUrl);

export const releaseSelectionReason = ({ release, product }) => {
  if (!release || !product) return "Release and product details are still loading.";
  if (!RELEASE_SELECTABLE_PRODUCT_STATUSES.has(product.status)) {
    return `${product.status} products do not allow Publisher release selection.`;
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

export const isEligibleSubscriptionOffer = (offer) =>
  offer?.type === "SUBSCRIPTION" &&
  /^\d+$/.test(offer.priceAmount) &&
  BigInt(offer.priceAmount) > 0n &&
  Number.isInteger(offer.durationDays) &&
  offer.durationDays > 0;

export const hasEligibleSubscriptionOffer = (offers = []) =>
  offers.some(isEligibleSubscriptionOffer);

export const buildActivationReadiness = ({ product, currentRelease }) => {
  const releasePublished = currentRelease?.status === "PUBLISHED";
  const packageComplete = isReleasePackageComplete(currentRelease);
  const currentSelected = Boolean(
    product?.currentReleaseId && currentRelease?.id === product.currentReleaseId,
  );
  const subscriptionOffer = hasEligibleSubscriptionOffer(product?.offers);
  const productActive = product?.status === "ACTIVE";
  const lifecycleReady = Boolean(
    releasePublished && packageComplete && currentSelected && subscriptionOffer,
  );
  const activatable = Boolean(product?.status === "DRAFT" && lifecycleReady);
  const reactivatable = Boolean(product?.status === "ARCHIVED" && lifecycleReady);
  return {
    releasePublished,
    packageComplete,
    currentSelected,
    subscriptionOffer,
    productActive,
    lifecycleReady,
    activatable,
    reactivatable,
  };
};

export const activationReadinessReason = ({ product, currentRelease }) => {
  if (!product) return "Product details are still loading.";
  if (product.status !== "DRAFT") return "Only draft products can be activated.";
  if (!product.currentReleaseId) return "Select a current release before activation.";
  if (!currentRelease) return "Current release details are still loading.";
  if (currentRelease.id !== product.currentReleaseId) {
    return "The selected release is stale. Refresh activation readiness.";
  }
  if (currentRelease.status !== "PUBLISHED") {
    return "The current release must be published before activation.";
  }
  if (!isReleasePackageComplete(currentRelease)) {
    return "The current release package is incomplete.";
  }
  if (!hasEligibleSubscriptionOffer(product.offers)) {
    return "Add at least one valid subscription offer before activation.";
  }
  return null;
};
