import { useState } from "react";
import { adminProductApi } from "../api/adminProductApi";
import { parseAdminProductDetailEnvelope } from "../model/adminProductContract";
import { toAdminProductError } from "../model/adminProductError";
import GovernanceDialog from "./GovernanceDialog";
import styles from "../page/AdminProductGovernance.module.css";

export default function SelectCurrentReleaseDialog({
  product,
  release,
  currentRelease,
  onClose,
  onSuccess,
  onVerify,
}) {
  const [busy, setBusy] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    let mutationAccepted = false;
    try {
      await adminProductApi.selectCurrentRelease(product.id, {
        releaseId: release.id,
      });
      mutationAccepted = true;
      const response = await adminProductApi.detail(product.id);
      const verifiedProduct = parseAdminProductDetailEnvelope(response.data);
      if (verifiedProduct.currentReleaseId !== release.id) {
        setVerificationPending(true);
        setError({
          message: "The request completed, but the Product pointer could not be verified. Refresh before retrying.",
        });
        onVerify();
        return;
      }
      onSuccess();
    } catch (caught) {
      if (mutationAccepted) {
        setVerificationPending(true);
        setError({
          message: "The server accepted the action, but the current-release pointer could not be verified. Close this dialog and review the refreshed Product before retrying.",
        });
        onVerify();
        return;
      }
      const mapped = toAdminProductError(
        caught,
        "Unable to select this release as current.",
      );
      setError(mapped);
      if (mapped.conflict || mapped.uncertain) onVerify();
    } finally {
      setBusy(false);
    }
  };

  return (
    <GovernanceDialog
      title="Select current release"
      description={`${currentRelease ? `Version ${currentRelease.version}` : product.currentReleaseId ? `Release ${product.currentReleaseId}` : "No release"} is currently selected. Version ${release.version} will replace it for ${product.name || "this Product"}. The Product remains suspended until it is reactivated.`}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit} className={styles.dialogForm}>
        {error ? <div className={styles.formError} role="alert">{error.message}</div> : null}
        <footer className={styles.dialogActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button data-autofocus type="submit" className={styles.primaryButton} disabled={busy || verificationPending}>
            {busy ? "Selecting…" : "Select current release"}
          </button>
        </footer>
      </form>
    </GovernanceDialog>
  );
}
