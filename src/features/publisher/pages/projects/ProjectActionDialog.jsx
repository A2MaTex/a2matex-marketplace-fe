import { useEffect, useRef, useState } from "react";
import { FiArchive, FiEdit3, FiX } from "react-icons/fi";
import { buildProjectUpdateInput } from "./model/projectMutation";
import styles from "./ProjectActionDialog.module.css";

const ProjectActionDialog = ({
  mode,
  project,
  busy,
  error,
  onClose,
  onSave,
  onArchive,
}) => {
  const [form, setForm] = useState(() => ({
    name: project.name,
    description: project.description ?? "",
  }));
  const [validationError, setValidationError] = useState(null);
  const initialFocusRef = useRef(null);
  const isEdit = mode === "edit";
  const titleId = `project-${mode}-dialog-title`;
  const descriptionId = `project-${mode}-dialog-description`;

  useEffect(() => {
    initialFocusRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isEdit) {
      onArchive();
      return;
    }

    try {
      const input = buildProjectUpdateInput(form);
      setValidationError(null);
      onSave(input);
    } catch (validationFailure) {
      setValidationError(validationFailure.message);
    }
  };

  const message = validationError ?? error?.message ?? null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className={styles.header}>
          <span className={`${styles.icon} ${isEdit ? "" : styles.dangerIcon}`} aria-hidden="true">
            {isEdit ? <FiEdit3 /> : <FiArchive />}
          </span>
          <div>
            <h2 id={titleId}>{isEdit ? "Edit project" : "Archive project"}</h2>
            <p id={descriptionId}>
              {isEdit
                ? "Update the project information shown in Publisher Hub."
                : "The draft remains available to view, but this project can no longer be edited."}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={busy}
            aria-label="Close dialog"
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {isEdit ? (
              <>
                <label className={styles.field}>
                  <span>Project name</span>
                  <input
                    ref={initialFocusRef}
                    type="text"
                    value={form.name}
                    maxLength={255}
                    disabled={busy}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    autoComplete="off"
                  />
                  <small>{form.name.length}/255</small>
                </label>

                <label className={styles.field}>
                  <span>Description</span>
                  <textarea
                    value={form.description}
                    maxLength={4000}
                    rows={5}
                    disabled={busy}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Optional project description"
                  />
                  <small>{form.description.length}/4,000</small>
                </label>
              </>
            ) : (
              <div className={styles.archiveMessage}>
                <p>
                  Move <strong>{project.name}</strong> to the archive?
                </p>
                <span>You can’t restore this workflow from Publisher Hub once it’s archived.</span>
              </div>
            )}

            {message ? <p className={styles.error} role="alert">{message}</p> : null}
          </div>

          <footer className={styles.footer}>
            <button
              ref={isEdit ? undefined : initialFocusRef}
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={isEdit ? styles.saveButton : styles.archiveButton}
              disabled={busy}
            >
              {busy
                ? isEdit
                  ? "Saving..."
                  : "Archiving..."
                : isEdit
                  ? "Save changes"
                  : "Archive project"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default ProjectActionDialog;
