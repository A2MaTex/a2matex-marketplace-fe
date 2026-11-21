import { useEffect, useRef, useState } from "react";
import { FiImage, FiTrash2, FiUploadCloud } from "react-icons/fi";
import { staticApi } from "@api/static/staticApi";
import StaticImage from "../../components/StaticImage";
import styles from "./ProductMediaSection.module.css";

const mediaOfType = (media, type) => media.filter((item) => item.type === type);

const MediaPreview = ({ item, className }) =>
  item.previewUrl ? (
    <img src={item.previewUrl} alt={item.altText ?? ""} className={className} />
  ) : (
    <StaticImage
      staticId={item.staticId}
      variant="medium"
      alt={item.altText ?? ""}
      className={className}
    />
  );

const SingleImageField = ({
  type,
  item,
  label,
  hint,
  disabled,
  uploading,
  onOpen,
  onRemove,
  controlId,
  required,
}) => (
  <div className={styles.singleField}>
    <div className={styles.fieldHeading}>
      <div>
        <strong>{label}{required ? <b className={styles.requiredMark} aria-label="required">*</b> : null}</strong>
        <span>{hint}</span>
      </div>
      {!disabled && item ? (
        <button type="button" onClick={() => onRemove(item)} aria-label={`Remove ${label}`}>
          <FiTrash2 />
        </button>
      ) : null}
    </div>
    {item ? (
      <button
        id={controlId}
        type="button"
        className={styles.singlePreview}
        onClick={() => !disabled && onOpen(type)}
        disabled={disabled || uploading}
        aria-label={`Change ${label}`}
      >
        <MediaPreview item={item} className={styles.previewImage} />
      </button>
    ) : (
      <div className={styles.emptySingleField}>
        <button
          id={controlId}
          type="button"
          className={styles.uploadBox}
          onClick={() => onOpen(type)}
          disabled={disabled || uploading}
        >
          <FiUploadCloud /> <span>Upload {label.toLowerCase()}</span>
        </button>
        {required ? <small>A default icon will be applied if you do not upload one.</small> : null}
      </div>
    )}
  </div>
);

const ProductMediaSection = ({
  media,
  onChange,
  disabled,
  iconRequired = false,
  sectionNumber = 2,
}) => {
  const inputRef = useRef(null);
  const inputTypeRef = useRef("GALLERY");
  const ownedUrlsRef = useRef(new Set());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => () => {
    ownedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    ownedUrlsRef.current.clear();
  }, []);

  const openPicker = (type) => {
    inputTypeRef.current = type;
    if (inputRef.current) {
      inputRef.current.multiple = type === "GALLERY";
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  const revokeOwnedPreview = (item) => {
    if (item?.previewUrl && ownedUrlsRef.current.has(item.previewUrl)) {
      URL.revokeObjectURL(item.previewUrl);
      ownedUrlsRef.current.delete(item.previewUrl);
    }
  };

  const replaceType = (type, newItems) => {
    const removed = mediaOfType(media, type);
    removed.forEach(revokeOwnedPreview);
    onChange([...media.filter((item) => item.type !== type), ...newItems]);
  };

  const handleFiles = async (event) => {
    const type = inputTypeRef.current;
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const selected = type === "GALLERY" ? files : files.slice(0, 1);
    const invalid = selected.find((file) => !file.type.startsWith("image/"));
    if (invalid) {
      setError(`${invalid.name} is not an image.`);
      return;
    }

    setUploading(true);
    setError(null);
    const previews = selected.map((file) => {
      const url = URL.createObjectURL(file);
      ownedUrlsRef.current.add(url);
      return url;
    });

    try {
      const results = await Promise.all(selected.map((file) => staticApi.uploadImage({ file })));
      const uploaded = results.map((response, index) => {
        const staticId = response.data?.data?.id;
        if (!staticId) throw new Error("The image service did not return an asset id.");
        return {
          staticId,
          type,
          sortOrder: type === "GALLERY" ? mediaOfType(media, "GALLERY").length + index : 0,
          altText: null,
          previewUrl: previews[index],
        };
      });

      if (type === "GALLERY") onChange([...media, ...uploaded]);
      else replaceType(type, uploaded);
    } catch (uploadError) {
      previews.forEach((url) => {
        if (ownedUrlsRef.current.has(url)) URL.revokeObjectURL(url);
        ownedUrlsRef.current.delete(url);
      });
      setError(uploadError?.response?.data?.message ?? uploadError.message ?? "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeItem = (target) => {
    revokeOwnedPreview(target);
    onChange(media.filter((item) => item !== target));
  };

  const icon = mediaOfType(media, "ICON")[0] ?? null;
  const cover = mediaOfType(media, "COVER")[0] ?? null;
  const gallery = mediaOfType(media, "GALLERY");

  return (
    <section className={styles.section} aria-labelledby="product-media-title">
      <header>
        <span className={styles.sectionIcon}><FiImage /></span>
        <div>
          <h2 id="product-media-title">{sectionNumber}. Product media</h2>
          <p>Upload the icon, cover and gallery images shown in the marketplace.</p>
        </div>
        <span className={styles.sectionMeta}>{gallery.length} gallery {gallery.length === 1 ? "image" : "images"}</span>
      </header>

      <div className={styles.singleGrid}>
        <SingleImageField type="ICON" item={icon} label="Icon" hint="Square product identity" disabled={disabled} uploading={uploading} onOpen={openPicker} onRemove={removeItem} controlId="product-icon-control" required={iconRequired} />
        <SingleImageField type="COVER" item={cover} label="Cover" hint="Primary catalog artwork (optional)" disabled={disabled} uploading={uploading} onOpen={openPicker} onRemove={removeItem} />
      </div>

      <div className={styles.galleryField}>
        <div className={styles.fieldHeading}>
          <div><strong>Gallery</strong><span>{gallery.length} images · optional</span></div>
          {!disabled ? (
            <button type="button" onClick={() => openPicker("GALLERY")} disabled={uploading}>
              <FiUploadCloud /> Add images
            </button>
          ) : null}
        </div>
        {gallery.length > 0 ? (
          <div className={styles.gallery}>
            {gallery.map((item, index) => (
              <figure key={`${item.staticId}:${index}`}>
                <MediaPreview item={item} className={styles.galleryImage} />
                <figcaption>
                  <span>Image {index + 1}</span>
                  {!disabled ? (
                    <button type="button" onClick={() => removeItem(item)} aria-label={`Remove image ${index + 1}`}>
                      <FiTrash2 />
                    </button>
                  ) : null}
                </figcaption>
              </figure>
            ))}
            {!disabled ? (
              <button type="button" className={styles.galleryAdd} onClick={() => openPicker("GALLERY")} disabled={uploading}>
                <FiUploadCloud />
                <span>Add preview images</span>
              </button>
            ) : null}
          </div>
        ) : (
          disabled ? (
            <p className={styles.emptyGallery}>No gallery images yet.</p>
          ) : (
            <button type="button" className={styles.emptyGallery} onClick={() => openPicker("GALLERY")} disabled={uploading}>
              <FiUploadCloud />
              <span>Add preview images</span>
            </button>
          )
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFiles} />
      {uploading ? <p className={styles.uploadStatus} role="status">Uploading images...</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </section>
  );
};

export default ProductMediaSection;
