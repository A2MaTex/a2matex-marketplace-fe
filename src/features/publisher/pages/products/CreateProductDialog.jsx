import { useEffect, useRef, useState } from "react";
import {
  FiArrowRight,
  FiCheck,
  FiFolder,
  FiGitBranch,
  FiInfo,
  FiRefreshCw,
  FiShoppingBag,
  FiX,
} from "react-icons/fi";
import styles from "./ProductDialog.module.css";

const formatRelativeTime = (value) => {
  if (!value) return "Not updated yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Update time unavailable";

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const ranges = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let valueInUnit = seconds;
  for (const [range, unit] of ranges) {
    if (Math.abs(valueInUnit) < range) {
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        Math.round(valueInUnit),
        unit,
      );
    }
    valueInUnit /= range;
  }
  return date.toLocaleDateString();
};

const CreateProductDialog = ({
  projects,
  loading,
  error,
  onRetry,
  onClose,
  onContinue,
}) => {
  const [selectedId, setSelectedId] = useState("");
  const closeRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const effectiveSelectedId = selectedId || projects[0]?.id || "";
  const selected =
    projects.find((project) => project.id === effectiveSelectedId) ?? null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        className={`${styles.dialog} ${styles.createDialog}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-product-title"
        aria-describedby="create-product-description"
      >
        <header className={styles.createHeader}>
          <span className={styles.createIcon}>
            <FiShoppingBag />
          </span>
          <div>
            <p className={styles.createEyebrow}>Publisher catalog</p>
            <h2 id="create-product-title">Create new product</h2>
            <p id="create-product-description">
              Choose the active project this product will package.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <FiX />
          </button>
        </header>

        <div className={`${styles.body} ${styles.createBody}`}>
          <div className={styles.projectSectionHeader}>
            <div>
              <FiFolder aria-hidden="true" />
              <span>Projects <b className={styles.requiredMark} aria-label="required">*</b></span>
            </div>
            <div className={styles.projectSectionMeta}>
              <span>
                {loading
                  ? "Checking projects..."
                  : `${projects.length} available`}
              </span>
              <button
                type="button"
                onClick={onRetry}
                disabled={loading}
                aria-label="Refresh eligible projects"
                title="Refresh eligible projects"
              >
                <FiRefreshCw />
              </button>
            </div>
          </div>

          {loading ? (
            <div
              className={styles.projectListShell}
              aria-label="Loading eligible projects"
            >
              {[0, 1].map((item) => (
                <span key={item} className={styles.projectSkeleton} />
              ))}
            </div>
          ) : null}
          {error ? (
            <div className={styles.createState} role="alert">
              <span className={styles.createStateIcon}>
                <FiRefreshCw />
              </span>
              <strong>Projects unavailable</strong>
              <p>{error.message}</p>
              <button type="button" onClick={onRetry}>
                <FiRefreshCw /> Try again
              </button>
            </div>
          ) : null}
          {!loading && !error && projects.length === 0 ? (
            <div className={styles.createState}>
              <span className={styles.createStateIcon}>
                <FiGitBranch />
              </span>
              <strong>No eligible projects</strong>
              <p>
                Create an active project in A2MaTeX Studio, or check whether
                each project already has a product.
              </p>
            </div>
          ) : null}
          {!loading && !error && projects.length > 0 ? (
            <div
              className={`${styles.projectList} ${styles.projectListShell}`}
              role="radiogroup"
              aria-label="Eligible projects"
            >
              {projects.map((project) => (
                <label
                  key={project.id}
                  className={
                    effectiveSelectedId === project.id
                      ? styles.projectSelected
                      : ""
                  }
                >
                  <input
                    className={styles.projectRadio}
                    type="radio"
                    name="project"
                    value={project.id}
                    checked={effectiveSelectedId === project.id}
                    onChange={() => setSelectedId(project.id)}
                  />
                  <span className={styles.projectIcon}>
                    <FiGitBranch />
                  </span>
                  <span className={styles.projectContent}>
                    <span className={styles.projectTitleRow}>
                      <strong>{project.name}</strong>
                    </span>
                    <small>
                      {project.description || "No project description"}
                    </small>
                    <span className={styles.projectUpdated}>
                      Updated{" "}
                      {formatRelativeTime(
                        project.updatedAt ?? project.createdAt,
                      )}
                    </span>
                  </span>
                  <span className={styles.projectCheck} aria-hidden="true">
                    <FiCheck />
                  </span>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <footer className={styles.createFooter}>
          <p>
            <FiInfo aria-hidden="true" /> No product is created until you save
            its details.
          </p>
          <div>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={`${styles.primary} ${styles.continueButton}`}
              disabled={!selected}
              onClick={() => onContinue(selected)}
            >
              Continue to details <FiArrowRight />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default CreateProductDialog;
