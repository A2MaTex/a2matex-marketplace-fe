import { useEffect, useMemo, useState } from "react";
import { adminProductApi } from "../api/adminProductApi";
import { loadAllProductReleases } from "../hooks/useAdminProductGovernance";
import {
  ADMIN_RELEASE_REASON_MAX_LENGTH,
  buildDisableReleaseRequest,
  parseAdminProductDetailEnvelope,
  parseAdminProductReleaseDetailEnvelope,
} from "../model/adminProductContract";
import { toAdminProductError } from "../model/adminProductError";
import GovernanceDialog from "./GovernanceDialog";
import styles from "../page/AdminProductGovernance.module.css";

export default function DisableReleaseDialog({
  product,
  release,
  onClose,
  onSuccess,
  onVerify,
}) {
  const replacementRequired = product.status === "ACTIVE" && release.isCurrent;
  const [reason, setReason] = useState("");
  const [replacementReleaseId, setReplacementReleaseId] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(replacementRequired);
  const [busy, setBusy] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!replacementRequired) return undefined;
    const controller = new AbortController();
    loadAllProductReleases(product.id, { signal: controller.signal })
      .then((items) =>
        Promise.all(
          items
            .filter(
              (candidate) =>
                candidate.id !== release.id && candidate.status === "PUBLISHED",
            )
            .map((candidate) =>
              adminProductApi
                .releaseDetail(product.id, candidate.id, { signal: controller.signal })
                .then((response) =>
                  parseAdminProductReleaseDetailEnvelope(response.data, product.id),
                ),
            ),
        ),
      )
      .then((details) => {
        setCandidates(
          details.filter(
            (candidate) =>
              Boolean(candidate.packageHash) && Boolean(candidate.downloadUrl),
          ),
        );
      })
      .catch((caught) => {
        if (caught?.code !== "ERR_CANCELED") {
          setError(toAdminProductError(caught, "Unable to load replacement releases."));
        }
      })
      .finally(() => setLoadingCandidates(false));
    return () => controller.abort();
  }, [product.id, release.id, replacementRequired]);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === replacementReleaseId),
    [candidates, replacementReleaseId],
  );

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (replacementRequired && !selectedCandidate) {
      setError({ field: "replacementReleaseId", message: "Choose a replacement release." });
      return;
    }
    let request;
    try {
      request = buildDisableReleaseRequest({ reason, replacementReleaseId });
    } catch (caught) {
      setError(toAdminProductError(caught));
      return;
    }
    setBusy(true);
    setError(null);
    let mutationAccepted = false;
    try {
      await adminProductApi.disableRelease(product.id, release.id, request);
      mutationAccepted = true;
      const [productResponse, releaseResponse] = await Promise.all([
        adminProductApi.detail(product.id),
        adminProductApi.releaseDetail(product.id, release.id),
      ]);
      const verifiedProduct = parseAdminProductDetailEnvelope(productResponse.data);
      const verifiedRelease = parseAdminProductReleaseDetailEnvelope(
        releaseResponse.data,
        product.id,
      );
      const expectedPointer = replacementRequired
        ? replacementReleaseId
        : release.isCurrent
          ? null
          : product.currentReleaseId;
      if (
        verifiedRelease.status !== "DISABLED" ||
        verifiedProduct.currentReleaseId !== expectedPointer
      ) {
        setVerificationPending(true);
        setError({
          message: "The request completed, but the disabled state or current-release pointer could not be verified. Refresh before retrying.",
        });
        onVerify();
        return;
      }
      onSuccess();
    } catch (caught) {
      if (mutationAccepted) {
        setVerificationPending(true);
        setError({
          message: "The server accepted the disable action, but the final release state could not be verified. Close this dialog and review the refreshed records before retrying.",
        });
        onVerify();
        return;
      }
      const mapped = toAdminProductError(caught, "Unable to disable this release.");
      setError(mapped);
      if (mapped.conflict || mapped.uncertain) onVerify();
    } finally {
      setBusy(false);
    }
  };

  return (
    <GovernanceDialog
      title="Disable release"
      description={
        replacementRequired
          ? "This is the current release of an active Product. Select a published replacement so customers are never left without a current release."
          : release.isCurrent
            ? "Disabling the current release will clear the pointer because this Product is not active."
            : "Disabled releases cannot be re-enabled. Their audit metadata remains visible."
      }
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit} className={styles.dialogForm} noValidate>
        {replacementRequired ? (
          <label className={styles.field}>
            <span>Replacement release</span>
            <select
              data-autofocus
              value={replacementReleaseId}
              disabled={loadingCandidates || busy}
              aria-invalid={error?.field === "replacementReleaseId"}
              onChange={(event) => {
                setReplacementReleaseId(event.target.value);
                setError(null);
              }}
            >
              <option value="">
                {loadingCandidates ? "Loading releases…" : "Select a published release"}
              </option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.version}{candidate.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </select>
            {!loadingCandidates && candidates.length === 0 ? (
              <small>No replacement is available. This release cannot be disabled while the Product is active.</small>
            ) : null}
          </label>
        ) : null}
        <label className={styles.field}>
          <span>Disable reason</span>
          <textarea
            data-autofocus={!replacementRequired ? "true" : undefined}
            rows={5}
            value={reason}
            maxLength={ADMIN_RELEASE_REASON_MAX_LENGTH}
            aria-invalid={error?.field === "reason"}
            onChange={(event) => {
              setReason(event.target.value);
              setError(null);
            }}
          />
          <small>{reason.length}/{ADMIN_RELEASE_REASON_MAX_LENGTH}</small>
        </label>
        {error ? <div className={styles.formError} role="alert">{error.message}</div> : null}
        <footer className={styles.dialogActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="submit"
            className={styles.dangerButton}
            disabled={busy || verificationPending || loadingCandidates || (replacementRequired && candidates.length === 0)}
          >
            {busy ? "Disabling…" : "Disable release"}
          </button>
        </footer>
      </form>
    </GovernanceDialog>
  );
}
