import { useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { adminProductApi } from "../api/adminProductApi";
import {
  ADMIN_PRODUCT_REASON_MAX_LENGTH,
  buildProductModerationRequest,
  hasEligibleSubscriptionOffer,
  parseAdminProductDetailEnvelope,
} from "../model/adminProductContract";
import { toAdminProductError } from "../model/adminProductError";
import GovernanceDialog from "./GovernanceDialog";
import styles from "../page/AdminProductGovernance.module.css";

export default function ProductModerationDialog({
  product,
  currentRelease,
  currentReleaseLoading,
  onClose,
  onSuccess,
  onVerify,
}) {
  const isSuspend = product.status === "ACTIVE";
  const action = isSuspend ? "SUSPEND" : "REACTIVATE";
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [error, setError] = useState(null);
  const releaseReady =
    currentRelease?.status === "PUBLISHED" &&
    Boolean(currentRelease.packageHash) &&
    Boolean(currentRelease.downloadUrl);
  const offerReady = hasEligibleSubscriptionOffer(product.offers);

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    let request;
    try {
      request = buildProductModerationRequest({
        status: product.status,
        action,
        reason,
      });
    } catch (caught) {
      setError(toAdminProductError(caught));
      return;
    }
    setBusy(true);
    setError(null);
    let mutationAccepted = false;
    try {
      await adminProductApi.moderate(product.id, request);
      mutationAccepted = true;
      const response = await adminProductApi.detail(product.id);
      const verifiedProduct = parseAdminProductDetailEnvelope(response.data);
      const expectedStatus = isSuspend ? "SUSPENDED" : "ACTIVE";
      if (verifiedProduct.status !== expectedStatus) {
        setVerificationPending(true);
        setError({
          message: "The request completed, but the authoritative Product state did not change as expected. Refresh before retrying.",
        });
        onVerify();
        return;
      }
      const retainedPriorReason =
        isSuspend && verifiedProduct.statusReason !== request.reason;
      onSuccess(
        retainedPriorReason
          ? "Product is suspended. The server retained the existing moderation reason."
          : isSuspend
            ? "Product suspended successfully."
            : "Product reactivated successfully.",
      );
    } catch (caught) {
      if (mutationAccepted) {
        setVerificationPending(true);
        setError({
          message: "The server accepted the action, but its final state could not be verified. Close this dialog and review the refreshed Product before taking another action.",
        });
        onVerify();
        return;
      }
      const mapped = toAdminProductError(
        caught,
        `Unable to ${isSuspend ? "suspend" : "reactivate"} this Product.`,
      );
      setError(mapped);
      if (mapped.conflict || mapped.uncertain) onVerify();
    } finally {
      setBusy(false);
    }
  };

  return (
    <GovernanceDialog
      title={`${isSuspend ? "Suspend" : "Reactivate"} Product`}
      description={
        isSuspend
          ? "Suspending removes this Product from active marketplace availability. Existing release records are preserved."
          : "The backend performs the authoritative readiness check. The indicators below explain likely blockers before you submit."
      }
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit} className={styles.dialogForm} noValidate>
        {!isSuspend ? (
          <div className={styles.readiness}>
            <div className={releaseReady ? styles.ready : styles.notReady}>
              <span>Current release</span>
              <strong>
                {currentReleaseLoading
                  ? "Checking…"
                  : releaseReady
                    ? "Ready"
                    : "Missing or not selectable"}
              </strong>
            </div>
            <div className={offerReady ? styles.ready : styles.notReady}>
              <span>Subscription offer</span>
              <strong>{offerReady ? "Eligible" : "Missing"}</strong>
            </div>
            {(!releaseReady || !offerReady) && !currentReleaseLoading ? (
              <div className={styles.warning} role="note">
                <FiAlertTriangle aria-hidden="true" />
                Reactivation may be rejected until the Product has a packaged current
                release and an eligible subscription offer.
              </div>
            ) : null}
          </div>
        ) : (
          <label className={styles.field}>
            <span>Suspension reason</span>
            <textarea
              data-autofocus
              rows={5}
              value={reason}
              maxLength={ADMIN_PRODUCT_REASON_MAX_LENGTH}
              aria-invalid={error?.field === "reason"}
              onChange={(event) => {
                setReason(event.target.value);
                setError(null);
              }}
            />
            <small>{reason.length}/{ADMIN_PRODUCT_REASON_MAX_LENGTH}</small>
          </label>
        )}
        {error ? <div className={styles.formError} role="alert">{error.message}</div> : null}
        <footer className={styles.dialogActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            data-autofocus={!isSuspend ? "true" : undefined}
            type="submit"
            className={isSuspend ? styles.dangerButton : styles.primaryButton}
            disabled={busy || currentReleaseLoading || verificationPending}
          >
            {busy ? "Saving…" : isSuspend ? "Suspend Product" : "Reactivate Product"}
          </button>
        </footer>
      </form>
    </GovernanceDialog>
  );
}
