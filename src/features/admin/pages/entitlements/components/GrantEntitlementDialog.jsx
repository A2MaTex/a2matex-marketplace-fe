import { useEffect, useMemo, useRef, useState } from "react";
import { isCommerceUuid } from "@/features/commerce/model/commerceContract";
import { adminEntitlementApi } from "../api/adminEntitlementApi";
import { useAdminEntitlementReferences } from "../hooks/useAdminEntitlementReferences";
import {
  ADMIN_ENTITLEMENT_REASON_MAX_LENGTH,
  buildGrantEntitlementRequest,
} from "../model/adminEntitlementRequest";
import { toAdminEntitlementError } from "../model/adminEntitlementError";
import { parseAdminEntitlementEnvelope } from "../model/adminEntitlementContract";
import AdminEntitlementDialog from "./AdminEntitlementDialog";
import base from "../../user-manage/page/UserManage.module.css";
import styles from "../EntitlementManagementPage.module.css";

const initialForm = (defaults) => ({
  customerId: defaults.customerId ?? "",
  productId: defaults.productId ?? "",
  lifetime: true,
  expiresAt: "",
  reason: "",
});

export default function GrantEntitlementDialog({
  defaults,
  onClose,
  onSuccess,
  onVerify,
}) {
  const [form, setForm] = useState(() => initialForm(defaults));
  const [request, setRequest] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const errorRef = useRef(null);
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Local timezone",
    [],
  );
  const normalizedCustomerId = form.customerId.trim();
  const normalizedProductId = form.productId.trim();
  const references = useAdminEntitlementReferences([
    {
      customerId: isCommerceUuid(normalizedCustomerId)
        ? normalizedCustomerId
        : null,
      productId: isCommerceUuid(normalizedProductId)
        ? normalizedProductId
        : null,
    },
  ]);
  const customerReference = references.customers[normalizedCustomerId];
  const productReference = references.products[normalizedProductId];

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
      const response = await adminEntitlementApi.grant(request);
      parseAdminEntitlementEnvelope(response.data);
      onSuccess();
    } catch (caught) {
      const mapped = toAdminEntitlementError(
        caught,
        "Unable to grant this entitlement.",
      );
      setError(mapped);
      if (mapped.verifyRequired) onVerify();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminEntitlementDialog
      title="Grant or reset access"
      description="Enter authoritative UUIDs. Customer and Product names are resolved before confirmation."
      busy={busy}
      onClose={onClose}
    >
      <form
        className={`${base.dialogBody} ${styles.dialogBody}`}
        onSubmit={prepareConfirmation}
        noValidate
      >
        {error ? (
          <div
            ref={errorRef}
            className={base.formError}
            role="alert"
            tabIndex={-1}
          >
            {error.message}
          </div>
        ) : null}

        <label className={base.field}>
          <span>Customer UUID</span>
          <input
            value={form.customerId}
            onChange={(event) => update("customerId", event.target.value)}
            autoComplete="off"
            aria-invalid={error?.field === "customerId"}
            placeholder="00000000-0000-4000-8000-000000000000"
          />
          {customerReference ? (
            <small className={styles.referenceHint}>
              {customerReference.status === "loading"
                ? "Resolving customer…"
                : customerReference.name || "Customer name unavailable"}
              {customerReference.secondary ? ` · ${customerReference.secondary}` : ""}
            </small>
          ) : null}
        </label>

        <label className={base.field}>
          <span>Product UUID</span>
          <input
            value={form.productId}
            onChange={(event) => update("productId", event.target.value)}
            autoComplete="off"
            aria-invalid={error?.field === "productId"}
            placeholder="00000000-0000-4000-8000-000000000000"
          />
          {productReference ? (
            <small className={styles.referenceHint}>
              {productReference.status === "loading"
                ? "Resolving product…"
                : productReference.name || "Product name unavailable"}
              {productReference.secondary ? ` · ${productReference.secondary}` : ""}
            </small>
          ) : null}
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
            <span><strong>Lifetime</strong></span>
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
            <label className={base.field}>
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

        <label className={base.dialogField}>
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
              <div><dt>Customer</dt><dd>{customerReference?.name ?? request.customerId}</dd></div>
              <div><dt>Product</dt><dd>{productReference?.name ?? request.productId}</dd></div>
              <div><dt>Expiry sent</dt><dd>{request.expiresAt ?? "null (Lifetime)"}</dd></div>
            </dl>
          </div>
        ) : null}

        <footer className={base.dialogActions}>
          <button type="button" className={base.secondaryButton} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          {request ? (
            <button type="button" className={base.primaryButton} onClick={submit} disabled={busy}>
              {busy ? "Applying…" : "Confirm reset"}
            </button>
          ) : (
            <button type="submit" className={base.primaryButton}>
              Review grant
            </button>
          )}
        </footer>
      </form>
    </AdminEntitlementDialog>
  );
}
