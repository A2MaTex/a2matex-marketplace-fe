import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiAlertTriangle,
  FiUserCheck,
  FiUserX,
  FiX,
} from "react-icons/fi";
import { adminUserApi } from "../api/adminUserApi";
import { buildAdminUserStatusRequest } from "../model/adminUserModel";
import { toAdminUserError } from "../model/adminUserError";
import styles from "../page/UserManage.module.css";

const FOCUSABLE =
  'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function UserStatusDialog({ user, onClose, onSuccess, onConflict }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const dialogRef = useRef(null);
  const errorRef = useRef(null);
  const returnFocusRef = useRef(document.activeElement);
  const isBan = user.identity.status === "ACTIVE";
  const nextStatus = isBan ? "BANNED" : "ACTIVE";
  const action = isBan ? "Ban" : "Unban";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const returnFocus = returnFocusRef.current;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector("textarea")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocus?.focus?.();
    };
  }, []);

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
      request = buildAdminUserStatusRequest({ status: nextStatus, reason });
    } catch (caught) {
      setError(toAdminUserError(caught));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await adminUserApi.updateStatus(user.identity.id, request);
      onSuccess(nextStatus);
    } catch (caught) {
      const mapped = toAdminUserError(
        caught,
        `Unable to ${action.toLowerCase()} this user.`,
      );
      setError(mapped);
      if (mapped.conflict) onConflict();
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      className={styles.dialogBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-status-dialog-title"
        aria-describedby="user-status-dialog-description"
        onKeyDown={handleKeyDown}
      >
        <header className={styles.dialogHeader}>
          <div className={isBan ? styles.dialogDangerIcon : styles.dialogSuccessIcon}>
            <FiAlertTriangle aria-hidden="true" />
          </div>
          <div>
            <span className={styles.eyebrow}>Account status</span>
            <h2 id="user-status-dialog-title">
              {action} @{user.identity.username}?
            </h2>
          </div>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            disabled={busy}
            aria-label={`Close ${action.toLowerCase()} user dialog`}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        <form className={styles.dialogBody} onSubmit={submit} noValidate>
          <p id="user-status-dialog-description" className={styles.dialogDescription}>
            {isBan
              ? "All active sessions and devices will be revoked immediately. Unbanning later will not restore those sessions."
              : "This restores account access, but old sessions stay revoked. The user must sign in again."}
          </p>

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

          <label className={styles.dialogField}>
            <span>Reason</span>
            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError(null);
              }}
              rows={5}
              aria-invalid={error?.field === "reason"}
              placeholder={`Why should this account be ${isBan ? "banned" : "unbanned"}?`}
            />
            <small>This reason is stored in the user's audit history.</small>
          </label>

          <footer className={styles.dialogActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={isBan ? styles.dangerButton : styles.primaryButton}
              disabled={busy}
            >
              {isBan ? (
                <FiUserX aria-hidden="true" />
              ) : (
                <FiUserCheck aria-hidden="true" />
              )}
              {busy ? `${action}ning…` : `${action} user`}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
