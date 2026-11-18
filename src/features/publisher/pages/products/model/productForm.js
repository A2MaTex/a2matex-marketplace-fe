const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

const validateForm = (form) => {
  const name = normalizeText(form.name);
  const slug = normalizeText(form.slug);
  const shortDescription = normalizeText(form.shortDescription);
  const description = normalizeText(form.description);
  const usageInstructions = normalizeText(form.usageInstructions);

  if (name && name.length > 255) {
    throw new ProductValidationError("Product name must be 255 characters or fewer.", "name");
  }
  if (slug && (slug.length > 255 || !SLUG_PATTERN.test(slug))) {
    throw new ProductValidationError(
      "Slug may contain only lowercase letters, numbers and single hyphens.",
      "slug",
    );
  }
  if (shortDescription && shortDescription.length > 500) {
    throw new ProductValidationError(
      "Short description must be 500 characters or fewer.",
      "shortDescription",
    );
  }

  return {
    name,
    slug,
    shortDescription,
    description,
    usageInstructions,
    media: normalizeProductMedia(form.media),
  };
};

export const buildProductCreateInput = (form, projectId) => {
  if (typeof projectId !== "string" || projectId.length === 0) {
    throw new ProductValidationError("Select an eligible project before creating a product.");
  }
  return { projectId, ...validateForm(form) };
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
