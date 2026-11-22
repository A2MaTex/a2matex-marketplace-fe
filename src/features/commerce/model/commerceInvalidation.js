export const COMMERCE_INVALIDATED_EVENT = "a2matex:commerce-invalidated";

export const invalidateCommerceResources = (resources) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(COMMERCE_INVALIDATED_EVENT, {
      detail: { resources: [...new Set(resources)] },
    }),
  );
};
