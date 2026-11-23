export const entitlementProductId = (entitlement) =>
  entitlement?.productId ?? entitlement?.product?.id ?? null;

export const isActiveProductEntitlement = (entitlement, productId) =>
  Boolean(
    productId &&
      entitlement?.status === "ACTIVE" &&
      entitlementProductId(entitlement) === productId,
  );

export const hasActiveProductAccess = (entitlements, productId) =>
  entitlements.some((entitlement) =>
    isActiveProductEntitlement(entitlement, productId),
  );

const orderTimestamp = (order) =>
  Date.parse(order?.paidAt ?? order?.createdAt ?? "") || 0;

export const findLatestPaidOrderForProduct = (orders, productId) =>
  orders.reduce((latest, order) => {
    if (
      order?.status !== "PAID" ||
      order?.productId !== productId ||
      !order?.productOfferId
    ) {
      return latest;
    }

    if (!latest || orderTimestamp(order) > orderTimestamp(latest)) {
      return order;
    }
    return latest;
  }, null);

export const findCurrentProductOrder = (
  entitlements,
  orders,
  productId,
) => {
  const activeEntitlement = entitlements.find((entitlement) =>
    isActiveProductEntitlement(entitlement, productId),
  );

  return activeEntitlement?.grantSource === "ORDER"
    ? findLatestPaidOrderForProduct(orders, productId)
    : null;
};

export const isConfirmedOrderForIntent = (order, intent) =>
  Boolean(
    order?.status === "PAID" &&
      order?.productId === intent?.productId &&
      order?.productOfferId === intent?.productOfferId,
  );
