import { useEffect, useMemo, useRef, useState } from "react";
import { adminEntitlementApi } from "../api/adminEntitlementApi";
import {
  ADMIN_ENTITLEMENT_REASON_MAX_LENGTH,
  buildGrantEntitlementRequest,
} from "../model/adminEntitlementRequest";
import { toAdminEntitlementError } from "../model/adminEntitlementError";
import AdminEntitlementDialog from "./AdminEntitlementDialog";
import styles from "../EntitlementManagementPage.module.css";

const initialForm = (defaults) => ({
  customerId: defaults.customerId ?? "",
  productId: defaults.productId ?? "",
  lifetime: true,
  expiresAt: "",
  reason: "",
});

export default function GrantEntitlementDialog({ defaults, onClose, onSuccess }) {
  const [form, setForm] = useState(() => initialForm(defaults));
  const [request, setRequest] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const errorRef = useRef(null);
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Local timezone",
    [],
  );

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setRequest(null);
    setError(null);
  };

  const prepareConfirmation = (event) => {
    event.preventDefault();
    try {
      setRequest(buildGrantEntitlementRequest(form));
      setError(null);
    } catch (caught) {
      setError(toAdminEntitlementError(caught));
    }
  };

  const submit = async () => {
    if (!request || busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminEntitlementApi.grant(request);
      onSuccess();
    } catch (caught) {
      setError(
        toAdminEntitlementError(caught, "Unable to grant this entitlement."),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminEntitlementDialog
      title="Grant or reset access"
      description="Use authoritative Customer and Product UUIDs. No lookup API is available in the current contract."
      busy={busy}
      onClose={onClose}
    >
      <form className={styles.dialogBody} onSubmit={prepareConfirmation} noValidate>
        {error ? (
          <div
            ref={errorRef}
            className={styles.formError}
            role="alert"
            tabIndex={-1}
          >
            {error.message}
          </div>
        ) : null}

        <label className={styles.field}>
          <span>Customer UUID</span>
          <input
            value={form.customerId}
            onChange={(event) => update("customerId", event.target.value)}
            autoComplete="off"
            aria-invalid={error?.field === "customerId"}
            placeholder="00000000-0000-4000-8000-000000000000"
          />
        </label>

        <label className={styles.field}>
          <span>Product UUID</span>
          <input
            value={form.productId}
            onChange={(event) => update("productId", event.target.value)}
            autoComplete="off"
            aria-invalid={error?.field === "productId"}
            placeholder="00000000-0000-4000-8000-000000000000"
          />
        </label>

        <fieldset className={styles.expiryFieldset}>
          <legend>Expiry</legend>
          <label className={styles.radioRow}>
            <input
              type="radio"
              name="expiry-mode"
              checked={form.lifetime}
              onChange={() => update("lifetime", true)}
            />
            <span><strong>Lifetime</strong> — send explicit <code>null</code></span>
          </label>
          <label className={styles.radioRow}>
            <input
              type="radio"
              name="expiry-mode"
              checked={!form.lifetime}
              onChange={() => update("lifetime", false)}
            />
            <span><strong>Finite access</strong></span>
          </label>
          {!form.lifetime ? (
            <label className={styles.field}>
              <span>Local expiry · {timezone}</span>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) => update("expiresAt", event.target.value)}
                aria-invalid={error?.field === "expiresAt"}
              />
            </label>
          ) : null}
        </fieldset>

        <label className={styles.field}>
          <span>Audit reason</span>
          <textarea
            value={form.reason}
            onChange={(event) => update("reason", event.target.value)}
            maxLength={ADMIN_ENTITLEMENT_REASON_MAX_LENGTH}
            rows={4}
            aria-invalid={error?.field === "reason"}
            placeholder="Why is this access being granted or reset?"
          />
          <small>{form.reason.length} / {ADMIN_ENTITLEMENT_REASON_MAX_LENGTH}</small>
        </label>

        {request ? (
          <div className={styles.dangerNotice} role="note">
            <strong>This resets access; it does not extend it.</strong>
            <span>
              The operation may shorten an active entitlement and will restore a
              revoked entitlement. The server decides the final period and
              audit metadata.
            </span>
            <dl>
              <div><dt>Expiry sent</dt><dd>{request.expiresAt ?? "null (Lifetime)"}</dd></div>
            </dl>
          </div>
        ) : null}

        <footer className={styles.dialogActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          {request ? (
            <button type="button" className={styles.primaryButton} onClick={submit} disabled={busy}>
              {busy ? "Applying…" : "Confirm reset"}
            </button>
          ) : (
            <button type="submit" className={styles.primaryButton}>
              Review grant
            </button>
          )}
        </footer>
      </form>
    </AdminEntitlementDialog>
  );
}
