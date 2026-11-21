const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PRODUCT_REQUIRED_FIELDS = [
  "name",
  "slug",
  "shortDescription",
  "description",
  "usageInstructions",
];

export class ProductValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "ProductValidationError";
    this.field = field;
  }
}

export const generateProductSlug = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeText = (value) => {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
};

const RICH_CONTENT_PATTERN = /<(?:img|table|hr|video)\b/i;

// Summernote represents an empty editor with markup such as <p><br></p>.
// Treat that as empty while retaining real HTML (including non-text embeds).
const normalizeRichText = (value) => {
  const html = String(value ?? "").trim();
  if (!html) return null;
  const visibleText = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .trim();
  return visibleText || RICH_CONTENT_PATTERN.test(html) ? html : null;
};

const REQUIRED_MESSAGES = {
  name: "Product name is required.",
  slug: "Product slug is required.",
  shortDescription: "Short description is required.",
  description: "Description is required.",
  usageInstructions: "Usage instructions are required.",
};

export const normalizeProductMedia = (media = []) => {
  const icon = media.find((item) => item.type === "ICON");
  const cover = media.find((item) => item.type === "COVER");
  const gallery = media.filter((item) => item.type === "GALLERY");
  return [
    ...(icon ? [{ ...icon, type: "ICON", sortOrder: 0 }] : []),
    ...(cover ? [{ ...cover, type: "COVER", sortOrder: 0 }] : []),
    ...gallery.map((item, index) => ({
      ...item,
      type: "GALLERY",
      sortOrder: index,
      altText: normalizeText(item.altText),
    })),
  ].map((item) => ({
    staticId: item.staticId,
    type: item.type,
    sortOrder: item.sortOrder,
    altText: item.altText ?? null,
  }));
};

export const createProductForm = ({ product = null, project = null } = {}) => ({
  name: product?.name ?? project?.name ?? "",
  slug: product?.slug ?? generateProductSlug(project?.name ?? ""),
  shortDescription: product?.shortDescription ?? project?.description ?? "",
  description: product?.description ?? "",
  usageInstructions: product?.usageInstructions ?? "",
  media: (product?.media ?? []).map((item) => ({ ...item })),
});

const normalizeForm = (form) => {
  const name = normalizeText(form.name);
  const slug = normalizeText(form.slug);
  const shortDescription = normalizeText(form.shortDescription);
  const description = normalizeRichText(form.description);
  const usageInstructions = normalizeRichText(form.usageInstructions);

  return {
    name,
    slug,
    shortDescription,
    description,
    usageInstructions,
    media: normalizeProductMedia(form.media),
  };
};

export const getProductFormErrors = (form, { requireContent = false } = {}) => {
  const normalized = normalizeForm(form);
  const errors = {};

  if (requireContent) {
    PRODUCT_REQUIRED_FIELDS.forEach((field) => {
      if (!normalized[field]) errors[field] = REQUIRED_MESSAGES[field];
    });
  }

  if (normalized.name && normalized.name.length > 255) {
    errors.name = "Product name must be 255 characters or fewer.";
  }
  if (
    normalized.slug &&
    (normalized.slug.length > 255 || !SLUG_PATTERN.test(normalized.slug))
  ) {
    errors.slug =
      "Slug may contain only lowercase letters, numbers and single hyphens.";
  }
  if (normalized.shortDescription && normalized.shortDescription.length > 500) {
    errors.shortDescription = "Short description must be 500 characters or fewer.";
  }

  return errors;
};

const validateForm = (form, options) => {
  const errors = getProductFormErrors(form, options);
  const firstField = PRODUCT_REQUIRED_FIELDS.find((field) => errors[field]);
  const fallbackField = Object.keys(errors)[0];
  const field = firstField ?? fallbackField;
  if (field) throw new ProductValidationError(errors[field], field);
  return normalizeForm(form);
};

export const buildProductCreateInput = (form, projectId) => {
  if (typeof projectId !== "string" || projectId.length === 0) {
    throw new ProductValidationError("Select an eligible project before creating a product.");
  }
  return { projectId, ...validateForm(form, { requireContent: true }) };
};

const sameValue = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export const buildProductPatch = (form, initialForm) => {
  const next = validateForm(form);
  const initial = validateForm(initialForm);
  const patch = {};
  for (const key of [
    "name",
    "slug",
    "shortDescription",
    "description",
    "usageInstructions",
    "media",
  ]) {
    if (!sameValue(next[key], initial[key])) patch[key] = next[key];
  }
  return patch;
};

export const isProductFormDirty = (form, initialForm) =>
  Object.keys(buildProductPatch(form, initialForm)).length > 0;
