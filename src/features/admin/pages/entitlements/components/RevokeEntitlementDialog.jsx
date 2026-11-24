import { useEffect, useRef, useState } from "react";
import { adminEntitlementApi } from "../api/adminEntitlementApi";
import {
  ADMIN_ENTITLEMENT_REASON_MAX_LENGTH,
  buildRevokeEntitlementRequest,
} from "../model/adminEntitlementRequest";
import { toAdminEntitlementError } from "../model/adminEntitlementError";
import { parseAdminEntitlementEnvelope } from "../model/adminEntitlementContract";
import AdminEntitlementDialog from "./AdminEntitlementDialog";
import base from "../../user-manage/page/UserManage.module.css";
import styles from "../EntitlementManagementPage.module.css";

export default function RevokeEntitlementDialog({
  entitlement,
  customerReference,
  productReference,
  onClose,
  onSuccess,
  onVerify,
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const errorRef = useRef(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;

    let request;
    try {
      request = buildRevokeEntitlementRequest({ reason });
    } catch (caught) {
      setError(toAdminEntitlementError(caught));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await adminEntitlementApi.revoke(entitlement.id, request);
      parseAdminEntitlementEnvelope(response.data);
      onSuccess();
    } catch (caught) {
      const mapped = toAdminEntitlementError(
        caught,
        "Unable to revoke this entitlement.",
      );
      setError(mapped);
      if (mapped.verifyRequired) onVerify(mapped.conflict);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminEntitlementDialog
      title="Revoke entitlement"
      description={`${customerReference?.name || "Customer"} · ${productReference?.name || "Product"}`}
      busy={busy}
      tone="danger"
      onClose={onClose}
    >
      <form
        className={`${base.dialogBody} ${styles.dialogBody}`}
        onSubmit={submit}
        noValidate
      >
        {error ? (
          <div ref={errorRef} className={base.formError} role="alert" tabIndex={-1}>
            {error.message}
            {error.conflict ? " The list is being refreshed from the server." : ""}
          </div>
        ) : null}
        <div className={styles.dangerNotice} role="note">
          <strong>Access will be blocked immediately.</strong>
          <span>No local status is applied. The refreshed server record supplies the revocation time, actor and audit history.</span>
          <dl>
            <div><dt>Customer</dt><dd>{customerReference?.name ?? entitlement.customerId}</dd></div>
            <div><dt>Product</dt><dd>{productReference?.name ?? entitlement.productId}</dd></div>
          </dl>
        </div>
        <label className={base.dialogField}>
          <span>Revocation reason</span>
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError(null);
            }}
            maxLength={ADMIN_ENTITLEMENT_REASON_MAX_LENGTH}
            rows={5}
            aria-invalid={error?.field === "reason"}
            placeholder="Why is this entitlement being revoked?"
          />
          <small>{reason.length} / {ADMIN_ENTITLEMENT_REASON_MAX_LENGTH}</small>
        </label>
        <footer className={base.dialogActions}>
          <button type="button" className={base.secondaryButton} onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className={base.dangerButton} disabled={busy}>
            {busy ? "Revoking…" : "Revoke access"}
          </button>
        </footer>
      </form>
    </AdminEntitlementDialog>
  );
}
