import { useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiCreditCard,
  FiGrid,
  FiRotateCcw,
  FiSave,
} from "react-icons/fi";
import { createVietQrImageUrl } from "@/features/commerce/model/vietQr";
import { isSystemSettingDraftDirty } from "../model/systemSettingForm";
import { settingFieldLabel } from "../model/systemSettingPresentation";
import styles from "../page/AdminSystemSettingsPage.module.css";

const BANK_FIELDS = [
  {
    key: "SEPAY_BANK_ACCOUNT_NUMBER",
    label: "Account number",
    placeholder: "Enter the receiving account number",
  },
  {
    key: "SEPAY_BANK_NAME",
    label: "Bank name",
    placeholder: "Enter the receiving bank name",
  },
  {
    key: "SEPAY_BANK_ACCOUNT_HOLDER",
    label: "Account holder name",
    placeholder: "Enter the account holder name",
    wide: true,
  },
];

const formatUpdatedAt = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Never edited";

export default function SepayBankAccountCard({
  settings,
  drafts,
  validations,
  busy,
  onChange,
  onDiscard,
  onSave,
}) {
  const [failedQrUrl, setFailedQrUrl] = useState("");
  const settingsByKey = useMemo(
    () => new Map(settings.map((setting) => [setting.key, setting])),
    [settings],
  );
  const entries = BANK_FIELDS.map((config) => ({
    ...config,
    setting: settingsByKey.get(config.key),
  }));
  const completeRegistry = entries.every(
    ({ setting }) => setting?.editable && setting.schema.fields.length === 1,
  );
  const dirty = entries.some(({ setting }) =>
    isSystemSettingDraftDirty(setting ? drafts[setting.key] : null),
  );
  const stale = entries.some(
    ({ setting }) => setting && drafts[setting.key]?.stale,
  );
  const valid =
    completeRegistry &&
    entries.every(({ setting }) => validations[setting.key]?.valid);

  const valueFor = (key) => {
    const setting = settingsByKey.get(key);
    if (!setting) return "";
    const field = setting.schema.fields[0];
    if (!field) return "";
    return drafts[key]?.values[field.name] ?? "";
  };
  const qrUrl = createVietQrImageUrl({
    accountNumber: valueFor("SEPAY_BANK_ACCOUNT_NUMBER"),
    bankName: valueFor("SEPAY_BANK_NAME"),
    accountHolder: valueFor("SEPAY_BANK_ACCOUNT_HOLDER"),
  });
  const qrFailed = Boolean(qrUrl) && failedQrUrl === qrUrl;

  const latestUpdate = settings
    .map((setting) => setting.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <article className={styles.bankAccountCard}>
      <header className={styles.bankAccountHeader}>
        <div className={styles.bankAccountTitle}>
          <span className={styles.bankAccountIcon} aria-hidden="true">
            <FiCreditCard />
          </span>
          <div>
            <span className={styles.settingKey}>SEPAY RECEIVING ACCOUNT</span>
            <h3>Bank transfer details</h3>
            <p>
              These details are shown to customers when they create a top-up
              request.
            </p>
          </div>
        </div>
        {dirty ? <span className={styles.unsavedBadge}>Unsaved</span> : null}
      </header>

      <div className={styles.bankAccountBody}>
        <div className={styles.bankFields}>
          {!completeRegistry ? (
            <div className={styles.unsupportedState} role="alert">
              <FiAlertTriangle aria-hidden="true" />
              <div>
                <strong>Bank configuration is unavailable</strong>
                <span>
                  The backend must publish all three supported Sepay settings
                  before this account can be edited.
                </span>
              </div>
            </div>
          ) : (
            entries.map(({ key, label, placeholder, wide, setting }) => {
              const field = setting.schema.fields[0];
              const draft = drafts[key];
              const value = draft?.values[field.name] ?? "";
              const error = validations[key]?.errors[field.name];
              const inputId = `${key}-${field.name}`;

              return (
                <label
                  className={`${styles.field} ${wide ? styles.wideBankField : ""}`}
                  key={key}
                  htmlFor={inputId}
                >
                  <span>{label || settingFieldLabel(setting, field)}</span>
                  <input
                    id={inputId}
                    type="text"
                    maxLength={field.maxLength}
                    value={value}
                    placeholder={placeholder}
                    onChange={(event) =>
                      onChange(key, field.name, event.target.value)
                    }
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    autoComplete="off"
                    disabled={busy}
                  />
                  <span className={styles.fieldMeta}>
                    {error ? (
                      <b id={`${inputId}-error`} className={styles.fieldError}>
                        {error}
                      </b>
                    ) : field.maxLength !== undefined ? (
                      `${value.length}/${field.maxLength} characters`
                    ) : null}
                  </span>
                </label>
              );
            })
          )}

          {stale ? (
            <div className={`${styles.staleWarning} ${styles.wideBankField}`} role="alert">
              <FiAlertTriangle />
              Server data changed while this draft was open. Discard the draft
              and review the latest values before saving.
            </div>
          ) : null}
        </div>

        <aside className={styles.qrPreview} aria-label="VietQR preview">
          <div className={styles.qrPreviewHeader}>
            <span><FiGrid /> QR preview</span>
            {qrUrl && !qrFailed ? <FiCheckCircle aria-label="QR code ready" /> : null}
          </div>
          <div className={styles.qrCanvas}>
            {qrUrl && !qrFailed ? (
              <img
                src={qrUrl}
                alt="VietQR preview for the receiving bank account"
                onError={() => setFailedQrUrl(qrUrl)}
              />
            ) : (
              <div className={styles.qrPlaceholder}>
                <FiGrid />
                <strong>{qrFailed ? "QR preview unavailable" : "Complete the bank details"}</strong>
                <span>
                  {qrFailed
                    ? "The VietQR image service could not be reached."
                    : "The QR code appears after an account number and bank name are entered."}
                </span>
              </div>
            )}
          </div>
          <p>
            This preview contains the receiving account only. Amount and
            transfer content are added to each top-up request.
          </p>
        </aside>
      </div>

      <footer className={styles.bankAccountFooter}>
        <div className={styles.metadata}>
          <span>Last saved {formatUpdatedAt(latestUpdate)}</span>
          <span>Values are persisted as three independent settings.</span>
        </div>
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onDiscard}
            disabled={!dirty || busy}
          >
            <FiRotateCcw /> Discard changes
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onSave}
            disabled={!dirty || !valid || stale || busy}
          >
            <FiSave /> {busy ? "Saving…" : "Save bank account"}
          </button>
        </div>
      </footer>
    </article>
  );
}
