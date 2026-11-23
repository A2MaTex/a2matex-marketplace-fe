const MEDIA_TYPES = new Set(["ICON", "COVER", "GALLERY"]);
const OFFER_TYPES = new Set(["ONE_TIME", "SUBSCRIPTION"]);

export class MarketplaceContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "MarketplaceContractError";
  }
}

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const object = (value, label) => {
  if (!isObject(value)) {
    throw new MarketplaceContractError(`${label} must be an object.`);
  }
  return value;
};

const string = (value, label) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new MarketplaceContractError(`${label} must be a non-empty string.`);
  }
  return value;
};

const nullableString = (value, label) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new MarketplaceContractError(`${label} must be a string or null.`);
  }
  return value;
};

const integer = (value, label, minimum = 0) => {
  if (!Number.isInteger(value) || value < minimum) {
    throw new MarketplaceContractError(
      `${label} must be an integer greater than or equal to ${minimum}.`,
    );
  }
  return value;
};

const decimalString = (value, label) => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new MarketplaceContractError(`${label} must be a decimal string.`);
  }
  return value;
};

const envelopeData = (payload, label) => {
  const envelope = object(payload, `${label} envelope`);
  return object(envelope.data, `${label}.data`);
};

export const parseMarketplaceMedia = (value, label = "media") => {
  const media = object(value, label);
  const type = string(media.type, `${label}.type`);

  if (!MEDIA_TYPES.has(type)) {
    throw new MarketplaceContractError(`${label}.type is not supported.`);
  }

  return {
    id: string(media.id, `${label}.id`),
    staticId: string(media.staticId, `${label}.staticId`),
    type,
    sortOrder: integer(media.sortOrder, `${label}.sortOrder`),
    altText: nullableString(media.altText, `${label}.altText`),
  };
};

export const parseMarketplaceOffer = (value, label = "offer") => {
  const offer = object(value, label);
  const type = string(offer.type, `${label}.type`);

  if (!OFFER_TYPES.has(type)) {
    throw new MarketplaceContractError(`${label}.type is not supported.`);
  }

  const durationDays = offer.durationDays;
  if (
    type === "ONE_TIME" &&
    durationDays !== null &&
    (!Number.isInteger(durationDays) || durationDays <= 0)
  ) {
    throw new MarketplaceContractError(
      `${label}.durationDays must be null or a positive integer for ONE_TIME offers.`,
    );
  }
  if (
    type === "SUBSCRIPTION" &&
    (!Number.isInteger(durationDays) || durationDays <= 0)
  ) {
    throw new MarketplaceContractError(
      `${label}.durationDays must be a positive integer for SUBSCRIPTION offers.`,
    );
  }

  return {
    id: string(offer.id, `${label}.id`),
    type,
    durationDays,
    priceAmount: decimalString(offer.priceAmount, `${label}.priceAmount`),
  };
};

const parsePublisherSummary = (value, label) => {
  const publisher = object(value, label);
  return {
    username: string(publisher.username, `${label}.username`),
    displayName: string(publisher.displayName, `${label}.displayName`),
  };
};

const parseRelease = (value, label) => {
  const release = object(value, label);
  return {
    id: string(release.id, `${label}.id`),
    version: string(release.version, `${label}.version`),
    publishedAt: string(release.publishedAt, `${label}.publishedAt`),
    minimumLauncherVersion: string(
      release.minimumLauncherVersion,
      `${label}.minimumLauncherVersion`,
    ),
    minimumRuntimeVersion: string(
      release.minimumRuntimeVersion,
      `${label}.minimumRuntimeVersion`,
    ),
  };
};

const parseMinimumSubscriptionOffer = (value, label) => {
  const offer = object(value, label);
  const durationDays = integer(
    offer.durationDays,
    `${label}.durationDays`,
    1,
  );
  return {
    priceAmount: decimalString(offer.priceAmount, `${label}.priceAmount`),
    durationDays,
  };
};

export const parseMarketplaceProductSummary = (
  value,
  label = "product",
) => {
  const product = object(value, label);
  if (!Array.isArray(product.media)) {
    throw new MarketplaceContractError(`${label}.media must be an array.`);
  }

  return {
    id: string(product.id, `${label}.id`),
    name: string(product.name, `${label}.name`),
    slug: string(product.slug, `${label}.slug`),
    shortDescription: string(
      product.shortDescription,
      `${label}.shortDescription`,
    ),
    publisher: parsePublisherSummary(product.publisher, `${label}.publisher`),
    currentRelease: parseRelease(
      product.currentRelease,
      `${label}.currentRelease`,
    ),
    minimumSubscriptionOffer: parseMinimumSubscriptionOffer(
      product.minimumSubscriptionOffer,
      `${label}.minimumSubscriptionOffer`,
    ),
    media: product.media.map((item, index) =>
      parseMarketplaceMedia(item, `${label}.media[${index}]`),
    ),
  };
};

export const parseMarketplaceProductDetail = (
  value,
  label = "product",
) => {
  const product = object(value, label);
  const summary = parseMarketplaceProductSummary(product, label);

  if (!Array.isArray(product.offers)) {
    throw new MarketplaceContractError(`${label}.offers must be an array.`);
  }

  return {
    ...summary,
    description: string(product.description, `${label}.description`),
    usageInstructions: nullableString(
      product.usageInstructions,
      `${label}.usageInstructions`,
    ),
    offers: product.offers.map((item, index) =>
      parseMarketplaceOffer(item, `${label}.offers[${index}]`),
    ),
  };
};

export const parseMarketplaceProductPageEnvelope = (payload) => {
  const data = envelopeData(payload, "marketplaceProducts");
  if (!Array.isArray(data.items)) {
    throw new MarketplaceContractError(
      "marketplaceProducts.data.items must be an array.",
    );
  }

  return {
    items: data.items.map((item, index) =>
      parseMarketplaceProductSummary(
        item,
        `marketplaceProducts.data.items[${index}]`,
      ),
    ),
    totalItems: integer(
      data.totalItems,
      "marketplaceProducts.data.totalItems",
    ),
    page: integer(data.page, "marketplaceProducts.data.page", 1),
    limit: integer(data.limit, "marketplaceProducts.data.limit", 1),
    totalPages: integer(
      data.totalPages,
      "marketplaceProducts.data.totalPages",
    ),
  };
};

export const parseMarketplaceProductEnvelope = (payload) =>
  parseMarketplaceProductDetail(
    envelopeData(payload, "marketplaceProduct"),
    "marketplaceProduct.data",
  );

export const parsePublicPublisherEnvelope = (payload) => {
  const publisher = envelopeData(payload, "publicPublisher");
  return {
    username: string(publisher.username, "publicPublisher.data.username"),
    fullName: string(publisher.fullName, "publicPublisher.data.fullName"),
    avatarStaticId: nullableString(
      publisher.avatarStaticId,
      "publicPublisher.data.avatarStaticId",
    ),
    bio: nullableString(publisher.bio, "publicPublisher.data.bio"),
    website: nullableString(
      publisher.website,
      "publicPublisher.data.website",
    ),
    twitter: nullableString(
      publisher.twitter,
      "publicPublisher.data.twitter",
    ),
    linkedin: nullableString(
      publisher.linkedin,
      "publicPublisher.data.linkedin",
    ),
    github: nullableString(publisher.github, "publicPublisher.data.github"),
    instagram: nullableString(
      publisher.instagram,
      "publicPublisher.data.instagram",
    ),
    email: string(publisher.email, "publicPublisher.data.email"),
  };
};

export const isUuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
