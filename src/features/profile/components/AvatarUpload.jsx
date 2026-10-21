import { useState, useRef, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { staticApi } from "@/common/api/static/staticApi";
import styles from "./AvatarUpload.module.css";
import { BsCameraFill, BsCheckLg, BsXLg } from "react-icons/bs";
import { FiRefreshCw, FiUploadCloud } from "react-icons/fi";

/* ── helpers ───────────────────────────────────────────────────── */
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: "px", width: mediaWidth * 0.9 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

function canvasPreview(image, canvas, crop) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );
}

/* ── component ─────────────────────────────────────────────────── */
/**
 * Props:
 *  onDone(staticId: string, previewUrl: string) — called after upload succeeds
 *  onClose() — called to close the modal
 */
const AvatarUpload = ({ onDone, onClose }) => {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const inputRef = useRef(null);

  /* file selected */
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được lớn hơn 5MB.");
      return;
    }
    setError("");

    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result);
    reader.readAsDataURL(file);
  };

  /* image loaded — set default crop */
  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  /* upload cropped image */
  const handleUpload = async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) return;
    canvasPreview(imgRef.current, canvasRef.current, completedCrop);

    setUploading(true);
    setError("");
    try {
      const blob = await new Promise((resolve) =>
        canvasRef.current.toBlob(resolve, "image/jpeg", 0.92)
      );
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

      const res = await staticApi.uploadImage({ file });
      const staticId = res?.data?.data?.id ?? res?.data?.id;

      if (!staticId) throw new Error("Không nhận được static ID từ server.");

      // build preview URL from canvas
      const previewUrl = canvasRef.current.toDataURL("image/jpeg");
      onDone(staticId, previewUrl);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Upload thất bại.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handlePickAgain = () => {
    setImgSrc("");
    setCrop(undefined);
    setCompletedCrop(undefined);
    setError("");
    inputRef.current?.click();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>
            <BsCameraFill size={14} /> Upload Avatar
          </span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <BsXLg size={13} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {!imgSrc ? (
            /* Drop zone */
            <div
              className={styles.dropZone}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  // reuse file input logic via synthetic change
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  inputRef.current.files = dt.files;
                  inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }}
            >
              <FiUploadCloud size={36} className={styles.dropIcon} />
              <p className={styles.dropPrimary}>Click hoặc kéo thả ảnh vào đây</p>
              <p className={styles.dropSub}>PNG, JPG, WEBP — tối đa 5 MB</p>
            </div>
          ) : (
            /* Crop area */
            <div className={styles.cropArea}>
              <ReactCrop
                crop={crop}
                onChange={(px) => setCrop(px)}
                onComplete={(px) => setCompletedCrop(px)}
                aspect={1}
                circularCrop
                minWidth={60}
                minHeight={60}
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="crop preview"
                  className={styles.cropImg}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
              <p className={styles.cropHint}>Kéo để điều chỉnh vùng cắt</p>
            </div>
          )}

          {/* Hidden canvas for pixel export */}
          <canvas ref={canvasRef} className={styles.hiddenCanvas} />

          {/* Hidden input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={onFileChange}
          />

          {error && <p className={styles.errorMsg}>{error}</p>}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {imgSrc && (
            <button className={styles.btnGhost} onClick={handlePickAgain} disabled={uploading}>
              <FiRefreshCw size={13} /> Chọn ảnh khác
            </button>
          )}
          {!imgSrc && (
            <button className={styles.btnGhost} onClick={() => inputRef.current?.click()}>
              <BsCameraFill size={13} /> Chọn ảnh
            </button>
          )}
          <div className={styles.footerRight}>
            <button className={styles.btnGhost} onClick={onClose} disabled={uploading}>
              Hủy
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleUpload}
              disabled={!completedCrop || uploading}
            >
              {uploading ? (
                <>
                  <FiRefreshCw size={13} className={styles.spinIcon} /> Đang tải lên…
                </>
              ) : (
                <>
                  <BsCheckLg size={13} /> Xác nhận
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarUpload;
