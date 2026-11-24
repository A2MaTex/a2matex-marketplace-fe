import { FiAlertTriangle, FiCopy, FiRotateCcw, FiSave } from "react-icons/fi";
import { commissionPercent, isSystemSettingDraftDirty } from "../model/systemSettingForm";
import {
  settingDescription,
  settingFieldLabel,
} from "../model/systemSettingPresentation";
import styles from "../page/AdminSystemSettingsPage.module.css";

const compactId = (value) => (value ? `${value.slice(0, 8)}…${value.slice(-4)}` : "No actor recorded");

export default function SystemSettingCard({
  setting,
  draft,
  validation,
  busy,
  onChange,
  onDiscard,
  onSave,
  onCopyActor,
}) {
  const dirty = isSystemSettingDraftDirty(draft);

  return (
    <article className={styles.settingCard}>
      {dirty ? <span className={styles.unsavedBadge}>Unsaved</span> : null}
    
      <p className={styles.description}>{settingDescription(setting)}</p>

      {!setting.schema.supported || !setting.valueState.valid ? (
        <div className={styles.unsupportedState} role="alert">
          <FiAlertTriangle aria-hidden="true" />
          <div>
            <strong>Read-only contract mismatch</strong>
            <span>{setting.schema.reason ?? setting.valueState.reason}</span>
          </div>
        </div>
      ) : (
        <div className={styles.fields}>
          {setting.schema.fields.map((field) => {
            const value = draft?.values[field.name] ?? "";
            const error = validation?.errors[field.name];
            const inputId = `${setting.key}-${field.name}`;
            return (
              <label className={styles.field} key={field.name} htmlFor={inputId}>
                <span>{settingFieldLabel(setting, field)}</span>
                <input
                  id={inputId}
                  type={field.type === "integer" ? "number" : "text"}
                  step={field.type === "integer" ? 1 : undefined}
                  min={field.min}
                  max={field.max}
                  maxLength={field.maxLength}
                  value={value}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${inputId}-error` : undefined}
                  autoComplete="off"
                  disabled={busy}
                />
                <span className={styles.fieldMeta}>
                  {error ? (
                    <b id={`${inputId}-error`} className={styles.fieldError}>{error}</b>
                  ) : field.type === "integer" ? (
                    `Allowed range: ${field.min ?? "any"}–${field.max ?? "any"}`
                  ) : field.maxLength !== undefined ? (
                    `${value.length}/${field.maxLength} characters`
                  ) : null}
                </span>
              </label>
            );
          })}

          {setting.key === "COMMISSION_RATE_BPS" ? (
            <div className={styles.commissionPreview}>
              <span>Percentage preview</span>
              <strong>{commissionPercent(validation?.value?.rateBps)}</strong>
              <small>The persisted value remains an integer in basis points.</small>
            </div>
          ) : null}
        </div>
      )}

      {draft?.stale ? (
        <div className={styles.staleWarning} role="alert">
          <FiAlertTriangle />
          Server data changed while this draft was open. Discard and review the latest value before saving.
        </div>
      ) : null}

      <footer className={styles.cardFooter}>
        <div className={styles.metadata}>
          {setting.updatedById ? (
            <button type="button" onClick={() => onCopyActor(setting.updatedById)} title={setting.updatedById}>
              by {compactId(setting.updatedById)} <FiCopy />
            </button>
          ) : null}
        </div>
        {setting.editable ? (
          <div className={styles.cardActions}>
            <button type="button" className={styles.secondaryButton} onClick={onDiscard} disabled={!dirty || busy}>
              <FiRotateCcw /> Discard
            </button>
            <button type="button" className={styles.primaryButton} onClick={onSave} disabled={!dirty || !validation?.valid || draft?.stale || busy}>
              <FiSave /> {busy ? "Saving…" : "Save setting"}
            </button>
          </div>
        ) : null}
      </footer>
    </article>
  );
}
