const DECIMAL_PATTERN = /^\d+$/;

export const formatVnd = (amount) => {
  if (typeof amount !== "string" || !DECIMAL_PATTERN.test(amount)) {
    throw new TypeError("VND amount must be a decimal string.");
  }

  return `${new Intl.NumberFormat("vi-VN").format(BigInt(amount))} ₫`;
};

export const formatOfferDuration = (offer) =>
  offer.type === "ONE_TIME" ? "Lifetime" : `${offer.durationDays} days`;

export const formatMinimumOffer = (offer) =>
  `From ${formatVnd(offer.priceAmount)} / ${offer.durationDays} days`;
