import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle, FiSlash, FiUserCheck, FiX } from "react-icons/fi";
import { adminPublisherApi } from "../api/adminPublisherApi";
import {
  ADMIN_PUBLISHER_REASON_MAX_LENGTH,
  buildAdminPublisherStatusRequest,
} from "../model/adminPublisherContract";
import { toAdminPublisherError } from "../model/adminPublisherError";
import base from "../../user-manage/page/UserManage.module.css";
import styles from "../page/AdminPublisherModeration.module.css";

const FOCUSABLE =
  'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function PublisherStatusDialog({
  publisher,
  onClose,
  onSuccess,
  onVerify,
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const dialogRef = useRef(null);
  const errorRef = useRef(null);
  const returnFocusRef = useRef(document.activeElement);
  const isBlock = publisher.status === "ACTIVE";
  const nextStatus = isBlock ? "BLOCKED" : "ACTIVE";
  const action = isBlock ? "Block" : "Unblock";
  const userUnavailable = publisher.user.status !== "ACTIVE";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const returnFocus = returnFocusRef.current;
    document.body.style.overflow = "hidden";
    const target = isBlock
      ? dialogRef.current?.querySelector("textarea")
      : dialogRef.current?.querySelector('[data-autofocus="true"]');
    target?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocus?.focus?.();
    };
  }, [isBlock]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && !busy) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
    if (controls.length === 0) return;
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;

    let request;
    try {
      request = buildAdminPublisherStatusRequest({
        currentStatus: publisher.status,
        nextStatus,
        reason,
      });
    } catch (caught) {
      setError(toAdminPublisherError(caught));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await adminPublisherApi.updateStatus(publisher.id, request);
      onSuccess(nextStatus);
    } catch (caught) {
      const mapped = toAdminPublisherError(
        caught,
        `Unable to ${action.toLowerCase()} this Publisher account.`,
      );
      setError(mapped);
      if (mapped.conflict || mapped.uncertain) onVerify();
    } finally {
      setBusy(false);
    }
  };

  const displayName = publisher.profile?.fullName || publisher.user.username;

  return createPortal(
    <div
      className={base.dialogBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className={base.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publisher-status-dialog-title"
        aria-describedby="publisher-status-dialog-description"
        onKeyDown={handleKeyDown}
      >
        <header className={base.dialogHeader}>
          <div className={isBlock ? base.dialogDangerIcon : base.dialogSuccessIcon}>
            {isBlock ? <FiSlash aria-hidden="true" /> : <FiUserCheck aria-hidden="true" />}
          </div>
          <div>
            <span className={base.eyebrow}>Publisher access</span>
            <h2 id="publisher-status-dialog-title">
              {action} {displayName}?
            </h2>
          </div>
          <button
            type="button"
            className={base.iconButton}
            onClick={onClose}
            disabled={busy}
            aria-label={`Close ${action.toLowerCase()} Publisher dialog`}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <form className={base.dialogBody} onSubmit={submit} noValidate>
          <p
            id="publisher-status-dialog-description"
            className={base.dialogDescription}
          >
            {isBlock
              ? "Publisher access and the active Publisher role will be removed. The linked User account is not globally banned."
              : "Publisher access and the Publisher role will be restored. Product and release eligibility are still enforced separately."}
          </p>

          {!isBlock && userUnavailable ? (
            <div className={styles.dialogWarning} role="note">
              <FiAlertTriangle aria-hidden="true" />
              <span>
                The linked User is {publisher.user.status.toLowerCase()}. Unblocking
                the Publisher account may not restore effective access until the User
                account is active.
              </span>
            </div>
          ) : null}

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

          {isBlock ? (
            <label className={base.dialogField}>
              <span>Reason</span>
              <textarea
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setError(null);
                }}
                rows={5}
                maxLength={ADMIN_PUBLISHER_REASON_MAX_LENGTH}
                aria-invalid={error?.field === "reason"}
                placeholder="Explain why this Publisher account should be blocked…"
              />
              <small className={styles.fieldHintRow}>
                <span>This reason is stored with the Publisher moderation state.</span>
                <span>{reason.length}/{ADMIN_PUBLISHER_REASON_MAX_LENGTH}</span>
              </small>
            </label>
          ) : (
            <div className={styles.unblockNotice}>
              The current API does not accept an unblock reason. This action will
              clear the existing blocked reason and timestamp.
            </div>
          )}

          <footer className={base.dialogActions}>
            <button
              type="button"
              className={base.secondaryButton}
              onClick={onClose}
              disabled={busy}
              data-autofocus={!isBlock ? "true" : undefined}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={isBlock ? base.dangerButton : base.primaryButton}
              disabled={busy}
            >
              {isBlock ? <FiSlash aria-hidden="true" /> : <FiUserCheck aria-hidden="true" />}
              {busy ? `${action}ing…` : `${action} Publisher`}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
