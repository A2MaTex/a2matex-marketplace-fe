import { useEffect, useRef } from "react";
import { FiArchive, FiX } from "react-icons/fi";
import styles from "./ProductDialog.module.css";

const ProductLifecycleDialog = ({ product, busy, error, onClose, onArchive }) => {
  const cancelRef = useRef(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose]);

  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="archive-product-title">
        <header>
          <span className={`${styles.icon} ${styles.danger}`}><FiArchive /></span>
          <div><h2 id="archive-product-title">Archive product</h2><p>This action makes the product read-only.</p></div>
          <button type="button" className={styles.close} onClick={onClose} disabled={busy} aria-label="Close dialog"><FiX /></button>
        </header>
        <div className={styles.body}>
          <div className={styles.warning}>Archive <strong>{product.name || product.slug || "this product"}</strong>? Its project cannot be used to create another product after archive.</div>
          {error ? <p className={styles.error} role="alert">{error.message}</p> : null}
        </div>
        <footer><button ref={cancelRef} type="button" className={styles.cancel} onClick={onClose} disabled={busy}>Cancel</button><button type="button" className={styles.archive} onClick={onArchive} disabled={busy}>{busy ? "Archiving..." : "Archive product"}</button></footer>
      </section>
    </div>
  );
};

export default ProductLifecycleDialog;
