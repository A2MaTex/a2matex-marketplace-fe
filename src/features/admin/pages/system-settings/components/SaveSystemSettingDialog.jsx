import { useEffect, useRef } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import { settingPresentation } from "../model/systemSettingPresentation";
import styles from "../page/AdminSystemSettingsPage.module.css";

const displayValue = (value) =>
  Object.entries(value)
    .map(([key, entry]) => `${key}: ${String(entry)}`)
    .join(" · ");

export default function SaveSystemSettingDialog({ action, saving, error, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const groupedBankSave = action.kind === "sepay-group";
  const presentation = groupedBankSave
    ? null
    : settingPresentation(action.setting.key);
  const operational =
    groupedBankSave || action.setting.key.startsWith("SEPAY_");

  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !saving) onCancel();
      if (event.key !== "Tab") return;
      const focusable = [...dialogRef.current.querySelectorAll("button:not(:disabled)")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel, saving]);

  return (
    <div className={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && !saving && onCancel()}>
      <section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="setting-dialog-title">
        <header>
          <div>
            <span className={styles.eyebrow}>Confirm configuration</span>
            <h2 id="setting-dialog-title">
              {groupedBankSave
                ? "Save Sepay receiving account?"
                : `Save ${presentation.label}?`}
            </h2>
          </div>
          <button className={styles.iconButton} type="button" onClick={onCancel} disabled={saving} aria-label="Close dialog"><FiX /></button>
        </header>
        <div className={styles.dialogBody}>
          {groupedBankSave ? (
            <div className={styles.groupChangeList}>
              {action.changes.map(({ setting, value }) => (
                <div className={styles.groupChangeRow} key={setting.key}>
                  <span>{settingPresentation(setting.key).label}</span>
                  <div>
                    <small>Current</small>
                    <strong>{displayValue(setting.value)}</strong>
                  </div>
                  <div>
                    <small>New</small>
                    <strong>{displayValue(value)}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.changeGrid}>
              <div><span>Current value</span><strong>{displayValue(action.setting.value)}</strong></div>
              <div><span>New value</span><strong>{displayValue(action.value)}</strong></div>
            </div>
          )}
          <div className={styles.impactNotice}>
            <FiAlertTriangle />
            <p>{operational
              ? "New top-up requests read these values immediately. The screen saves the fields together, but the backend still updates each setting independently, so a failed request can result in a partial update."
              : "This value will be persisted, but the current backend does not expose evidence that all commission consumers use it yet."}</p>
          </div>
          {error ? <div className={styles.formError} role="alert">{error.message}</div> : null}
        </div>
        <footer>
          <button ref={cancelRef} type="button" className={styles.secondaryButton} onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="button" className={styles.primaryButton} onClick={onConfirm} disabled={saving}>{saving ? "Saving…" : "Confirm save"}</button>
        </footer>
      </section>
    </div>
  );
}
