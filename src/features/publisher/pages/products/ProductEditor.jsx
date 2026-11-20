import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiArchive,
  FiEdit3,
  FiInfo,
  FiPackage,
  FiPlay,
  FiSave,
} from "react-icons/fi";
import { publisherProductApi } from "../api/product/api";
import RichTextEditor from "../components/RichTextEditor";
import StaticImage from "../components/StaticImage";
import ProductMediaSection from "./sections/ProductMediaSection";
import { useProductEditor } from "./hooks/useProductEditor";
import { parseCreatedProductId, parseProductEnvelope } from "./model/productContract";
import { uploadDefaultProductIcon } from "./model/defaultProductIcon";
import {
  buildProductCreateInput,
  buildProductPatch,
  getProductFormErrors,
} from "./model/productForm";
import { canArchiveProduct, canEditProduct } from "./model/productPermissions";
import { toPublisherProductError } from "./model/publisherProductError";
import styles from "./ProductEditor.module.css";

const ProductArtwork = ({ media }) => {
  const icon = media.find((item) => item.type === "ICON") ?? null;

  if (icon?.previewUrl) {
    return <img src={icon.previewUrl} alt="" className={styles.productArtwork} />;
  }

  if (icon?.staticId) {
    return (
      <StaticImage
        staticId={icon.staticId}
        variant="small"
        alt=""
        className={styles.productArtwork}
      />
    );
  }

  return <span className={styles.productArtworkFallback}><FiPackage /></span>;
};

const ProductEditor = ({
  product,
  project,
  creating,
  onCreated,
  onSaved,
  onArchive,
  onDirtyChange,
  onChangeProject,
  standalone = false,
}) => {
  const editor = useProductEditor({ product, project });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [savedNotice, setSavedNotice] = useState(null);
  const [editing, setEditing] = useState(Boolean(creating));
  const statusIsEditable = creating || canEditProduct(product?.status);
  const editable = creating || (editing && statusIsEditable);

  const focusIconControl = () => {
    const control = document.getElementById("product-icon-control");
    control?.scrollIntoView({ behavior: "smooth", block: "center" });
    control?.focus({ preventScroll: true });
  };

  useEffect(() => onDirtyChange?.(editor.dirty), [editor.dirty, onDirtyChange]);

  const clearFieldError = (field) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (error?.field === field || error?.code === "VALIDATION_ERROR") setError(null);
  };

  const focusFirstInvalidField = (errors) => {
    const firstField = [
      "name",
      "slug",
      "shortDescription",
      "description",
      "usageInstructions",
    ].find((field) => errors[field]);
    if (!firstField) return;
    requestAnimationFrame(() => {
      document.querySelector(`[data-product-field="${firstField}"]`)?.focus();
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editable || submitting) return;

    if (creating) {
      const validationErrors = getProductFormErrors(editor.form, {
        requireContent: true,
      });
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        setError({
          code: "VALIDATION_ERROR",
          message: "Complete all required product details before creating the product.",
          field: Object.keys(validationErrors)[0],
        });
        focusFirstInvalidField(validationErrors);
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    setSavedNotice(null);

    try {
      if (creating) {
        let formToSubmit = editor.form;
        if (!formToSubmit.media.some((item) => item.type === "ICON")) {
          const defaultIcon = await uploadDefaultProductIcon();
          const media = [...formToSubmit.media, defaultIcon];
          formToSubmit = { ...formToSubmit, media };
          editor.setMedia(media);
        }
        const input = buildProductCreateInput(formToSubmit, project?.id);
        const response = await publisherProductApi.createProduct(input);
        const id = parseCreatedProductId(response.data);
        onDirtyChange?.(false);
        onCreated(id);
        return;
      }

      const patch = buildProductPatch(editor.form, editor.initialForm);
      if (Object.keys(patch).length === 0) return;
      await publisherProductApi.updateProduct(product.id, patch);
      const detailResponse = await publisherProductApi.getProduct(product.id);
      const refreshed = parseProductEnvelope(detailResponse.data);
      editor.acknowledge(refreshed);
      onSaved(refreshed);
      setEditing(false);
      setSavedNotice("Changes saved from the latest server state.");
    } catch (submitError) {
      const mappedError = toPublisherProductError(
        submitError,
        creating ? "Unable to create product." : "Unable to save product.",
      );
      setError(mappedError);
      if (mappedError.field) {
        setFieldErrors((current) => ({
          ...current,
          [mappedError.field]: mappedError.message,
        }));
        focusFirstInvalidField({ [mappedError.field]: mappedError.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={`${styles.editor} ${standalone ? styles.editorStandalone : ""}`} onSubmit={handleSubmit} noValidate>
      <div className={styles.scrollArea}>
        <div className={styles.content}>
          <header className={styles.editorHeader}>
            <div className={styles.productSummary}>
              <ProductArtwork media={editor.form.media} />
              <div className={styles.summaryBody}>
                <div className={styles.titleLine}>
                  <h1>{creating ? editor.form.name || project?.name || "Create product" : product?.name || product?.slug || "Untitled product"}</h1>
                  {!creating ? <span className={`${styles.status} ${styles[`status${product.status}`]}`}>{product.status}</span> : <span className={styles.status}>NEW</span>}
                </div>
                <div className={styles.summaryMeta}>
                  <button type="button" className={styles.iconButton} onClick={focusIconControl} disabled={!editable || submitting}>
                    <FiEdit3 /> {editor.form.media.some((item) => item.type === "ICON") ? "Change icon" : "Add icon"}
                  </button>
                  <p>{project?.name ? `Source project: ${project.name}` : "Product details"}</p>
                </div>
              </div>
            </div>
            <div className={styles.headerActions}>
              {creating && onChangeProject ? (
                <button type="button" className={styles.secondaryButton} onClick={onChangeProject} disabled={submitting}>
                  Change project
                </button>
              ) : null}
              {!creating && canArchiveProduct(product?.status) ? (
                <button type="button" className={styles.archiveButton} onClick={onArchive} disabled={submitting}>
                  <FiArchive /> Archive
                </button>
              ) : null}
              {!creating && statusIsEditable && !editing ? (
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => {
                    setError(null);
                    setSavedNotice(null);
                    setEditing(true);
                  }}
                >
                  <FiEdit3 /> Edit
                </button>
              ) : null}
              {!creating && editable ? (
                <button type="submit" className={styles.saveButton} disabled={submitting || (!creating && !editor.dirty)}>
                  <FiSave /> {submitting ? "Saving..." : "Save changes"}
                </button>
              ) : null}
              {!creating && product?.status === "DRAFT" ? (
                <button
                  type="button"
                  className={styles.activateButton}
                  disabled
                  title="Activation is waiting for the Publisher submission API."
                >
                  <FiPlay /> Activate
                </button>
              ) : null}
            </div>
          </header>

          {!statusIsEditable ? (
            <div className={styles.readOnlyNotice} role="status">
              <FiAlertTriangle />
              <div>
                <strong>This product is read-only.</strong>
                <span>{product?.status === "SUSPENDED" ? product.statusReason || "It was suspended by an administrator." : "Archived products cannot be edited."}</span>
              </div>
            </div>
          ) : null}

          <section className={styles.section} aria-labelledby="product-basic-title">
            <header className={styles.sectionHeader}>
              <span className={styles.sectionIcon}><FiInfo /></span>
              <div>
                <h2 id="product-basic-title">1. Basic information</h2>
                <p>The product name, identifier and customer-facing content shown on the marketplace.</p>
              </div>
              <span className={styles.sectionMeta}>Core details</span>
            </header>

            <div className={styles.fields}>
              <label className={fieldErrors.name ? styles.fieldInvalid : undefined}>
                <span>Product name {creating ? <b className={styles.requiredMark} aria-label="required">*</b> : null}<small>{editor.form.name.length}/255</small></span>
                <input
                  data-product-field="name"
                  type="text"
                  value={editor.form.name}
                  maxLength={255}
                  onChange={(event) => {
                    clearFieldError("name");
                    editor.setName(event.target.value);
                  }}
                  disabled={!editable || submitting}
                  placeholder="Product display name"
                  aria-required={creating}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "product-name-error" : undefined}
                />
                {fieldErrors.name ? <small id="product-name-error" className={styles.fieldError} role="alert">{fieldErrors.name}</small> : null}
              </label>
              <label className={fieldErrors.slug ? styles.fieldInvalid : undefined}>
                <span>Product slug {creating ? <b className={styles.requiredMark} aria-label="required">*</b> : null}<small>lowercase letters, numbers and hyphens</small></span>
                <input
                  data-product-field="slug"
                  type="text"
                  value={editor.form.slug}
                  maxLength={255}
                  onChange={(event) => {
                    clearFieldError("slug");
                    editor.setSlug(event.target.value);
                  }}
                  disabled={!editable || submitting}
                  placeholder="product-slug"
                  autoCapitalize="none"
                  spellCheck="false"
                  aria-required={creating}
                  aria-invalid={Boolean(fieldErrors.slug)}
                  aria-describedby={fieldErrors.slug ? "product-slug-error" : undefined}
                />
                {fieldErrors.slug ? <small id="product-slug-error" className={styles.fieldError} role="alert">{fieldErrors.slug}</small> : null}
              </label>
              <label className={fieldErrors.shortDescription ? styles.fieldInvalid : undefined}>
                <span>Short description {creating ? <b className={styles.requiredMark} aria-label="required">*</b> : null}<small>{editor.form.shortDescription.length}/500</small></span>
                <input
                  data-product-field="shortDescription"
                  type="text"
                  value={editor.form.shortDescription}
                  maxLength={500}
                  onChange={(event) => {
                    clearFieldError("shortDescription");
                    editor.setField("shortDescription", event.target.value);
                  }}
                  disabled={!editable || submitting}
                  placeholder="A short summary shown in product lists"
                  aria-required={creating}
                  aria-invalid={Boolean(fieldErrors.shortDescription)}
                  aria-describedby={fieldErrors.shortDescription ? "product-short-description-error" : undefined}
                />
                {fieldErrors.shortDescription ? <small id="product-short-description-error" className={styles.fieldError} role="alert">{fieldErrors.shortDescription}</small> : null}
              </label>
              <div className={`${styles.richField} ${fieldErrors.description ? styles.fieldInvalid : ""}`}>
                <div className={styles.richFieldLabel}>
                  <span>Description {creating ? <b className={styles.requiredMark} aria-label="required">*</b> : null}</span>
                  <small>Markdown Mode</small>
                </div>
                <RichTextEditor
                  value={editor.form.description}
                  rows={9}
                  onChange={(value) => {
                    clearFieldError("description");
                    editor.setField("description", value);
                  }}
                  disabled={!editable || submitting}
                  placeholder="Describe the product and its capabilities"
                  ariaLabel="Product description"
                  fieldName="description"
                  ariaRequired={creating}
                  ariaInvalid={Boolean(fieldErrors.description)}
                  ariaDescribedBy={fieldErrors.description ? "product-description-error" : undefined}
                />
                {fieldErrors.description ? <small id="product-description-error" className={styles.fieldError} role="alert">{fieldErrors.description}</small> : null}
              </div>
              <div className={`${styles.richField} ${fieldErrors.usageInstructions ? styles.fieldInvalid : ""}`}>
                <div className={styles.richFieldLabel}>
                  <span>Usage instructions {creating ? <b className={styles.requiredMark} aria-label="required">*</b> : null}</span>
                  <small>Markdown Mode</small>
                </div>
                <RichTextEditor
                  value={editor.form.usageInstructions}
                  rows={7}
                  onChange={(value) => {
                    clearFieldError("usageInstructions");
                    editor.setField("usageInstructions", value);
                  }}
                  disabled={!editable || submitting}
                  placeholder="Explain how customers use this product"
                  ariaLabel="Product usage instructions"
                  fieldName="usageInstructions"
                  ariaRequired={creating}
                  ariaInvalid={Boolean(fieldErrors.usageInstructions)}
                  ariaDescribedBy={fieldErrors.usageInstructions ? "product-usage-instructions-error" : undefined}
                />
                {fieldErrors.usageInstructions ? <small id="product-usage-instructions-error" className={styles.fieldError} role="alert">{fieldErrors.usageInstructions}</small> : null}
              </div>
            </div>
          </section>

          <ProductMediaSection
            media={editor.form.media}
            onChange={editor.setMedia}
            disabled={!editable || submitting}
            iconRequired={creating}
          />

          {!creating && product?.status === "SUSPENDED" && product.suspendedAt ? (
            <p className={styles.statusMeta}>Suspended at {new Date(product.suspendedAt).toLocaleString()}</p>
          ) : null}
        </div>
      </div>

      {creating || editor.dirty || savedNotice || error ? (
        <footer className={styles.editorFooter}>
          <div>
            {editor.dirty ? <span className={styles.dirty}>Unsaved changes</span> : <span>No local changes</span>}
            {savedNotice ? <span className={styles.saved} role="status">{savedNotice}</span> : null}
            {error ? <span className={styles.error} role="alert">{error.message}</span> : null}
          </div>
          <div className={styles.footerActions}>
            {editable && editor.dirty && !creating ? (
              <button type="button" className={styles.discardButton} onClick={editor.reset} disabled={submitting}>Discard changes</button>
            ) : null}
            {editable && creating ? (
              <button type="submit" className={styles.footerSaveButton} disabled={submitting}>
                <FiSave /> {submitting ? "Creating..." : "Create product"}
              </button>
            ) : null}
          </div>
        </footer>
      ) : null}
    </form>
  );
};

export default ProductEditor;
