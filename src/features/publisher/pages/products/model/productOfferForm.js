const OFFER_TYPES = new Set(["SUBSCRIPTION", "ONE_TIME"]);
const MAX_OFFERS = 10;
const MAX_DURATION_DAYS = 3650;
const MAX_PRICE_AMOUNT = 9223372036854775807n;
const PRICE_PATTERN = /^\d{1,19}$/;

export class ProductOfferValidationError extends Error {
  constructor(message, path = null) {
    super(message);
    this.name = "ProductOfferValidationError";
    this.path = path;
  }
}

const naturalKey = ({ type, durationDays }) =>
  `${type}:${durationDays ?? "PERMANENT"}`;

const normalizeOffer = (offer, index) => {
  const path = `offers[${index}]`;
  if (!OFFER_TYPES.has(offer?.type)) {
    throw new ProductOfferValidationError("Offer type is not supported.", `${path}.type`);
  }
  if (typeof offer.priceAmount !== "string" || !PRICE_PATTERN.test(offer.priceAmount)) {
    throw new ProductOfferValidationError(
      "Price must be an unsigned decimal string with at most 19 digits.",
      `${path}.priceAmount`,
    );
  }
  if (BigInt(offer.priceAmount) > MAX_PRICE_AMOUNT) {
    throw new ProductOfferValidationError(
      `Price must not exceed ${MAX_PRICE_AMOUNT}.`,
      `${path}.priceAmount`,
    );
  }

  if (offer.type === "SUBSCRIPTION") {
    if (BigInt(offer.priceAmount) <= 0n) {
      throw new ProductOfferValidationError(
        "Subscription price must be greater than zero.",
        `${path}.priceAmount`,
      );
    }
    if (
      !Number.isInteger(offer.durationDays) ||
      offer.durationDays <= 0 ||
      offer.durationDays > MAX_DURATION_DAYS
    ) {
      throw new ProductOfferValidationError(
        `Subscription duration must be between 1 and ${MAX_DURATION_DAYS} days.`,
        `${path}.durationDays`,
      );
    }
  } else if (
    offer.durationDays !== null &&
    (!Number.isInteger(offer.durationDays) ||
      offer.durationDays <= 0 ||
      offer.durationDays > MAX_DURATION_DAYS)
  ) {
    throw new ProductOfferValidationError(
      `One-time duration must be empty for lifetime access or between 1 and ${MAX_DURATION_DAYS} days.`,
      `${path}.durationDays`,
    );
  }

  return {
    type: offer.type,
    priceAmount: offer.priceAmount,
    durationDays: offer.durationDays,
  };
};

// The endpoint is full replacement: only rows present in this returned payload survive.
// Server IDs are deliberately omitted because identity is (type, durationDays).
export const buildProductOfferReplacement = (offers) => {
  if (!Array.isArray(offers)) {
    throw new ProductOfferValidationError("Offers must be an array.", "offers");
  }
  if (offers.length > MAX_OFFERS) {
    throw new ProductOfferValidationError(
      `Add at most ${MAX_OFFERS} offers.`,
      "offers",
    );
  }

  const normalized = offers.map(normalizeOffer);
  const seen = new Set();
  normalized.forEach((offer, index) => {
    const key = naturalKey(offer);
    if (seen.has(key)) {
      throw new ProductOfferValidationError(
        "Offer type and duration must be unique.",
        `offers[${index}].durationDays`,
      );
    }
    seen.add(key);
  });
  return { offers: normalized };
};

export const PRODUCT_OFFER_FORM_LIMITS = {
  maxOffers: MAX_OFFERS,
  maxDurationDays: MAX_DURATION_DAYS,
  maxPriceAmount: String(MAX_PRICE_AMOUNT),
};
