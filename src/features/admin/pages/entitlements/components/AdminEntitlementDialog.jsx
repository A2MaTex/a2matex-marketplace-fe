import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdOutlineKey, MdWarningAmber } from "react-icons/md";
import base from "../../user-manage/page/UserManage.module.css";
import styles from "../EntitlementManagementPage.module.css";

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export default function AdminEntitlementDialog({
  title,
  description,
  busy = false,
  wide = false,
  tone = "default",
  onClose,
  children,
}) {
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(document.activeElement);
  const titleId = `admin-entitlement-dialog-${title.toLowerCase().replace(/\W+/g, "-")}`;
  const descriptionId = `${titleId}-description`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const returnFocus = returnFocusRef.current;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector(FOCUSABLE)?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocus?.focus?.();
    };
  }, []);

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

  return createPortal(
    <div
      className={base.dialogBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className={`${base.dialog} ${wide ? styles.dialogWide : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onKeyDown={handleKeyDown}
      >
        <header className={base.dialogHeader}>
          <div
            className={
              tone === "danger"
                ? base.dialogDangerIcon
                : base.dialogSuccessIcon
            }
          >
            {tone === "danger" ? (
              <MdWarningAmber aria-hidden="true" />
            ) : (
              <MdOutlineKey aria-hidden="true" />
            )}
          </div>
          <div className={styles.dialogHeaderCopy}>
            <span className={base.eyebrow}>Entitlement access</span>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <button
            type="button"
            className={base.iconButton}
            onClick={onClose}
            disabled={busy}
            aria-label={`Close ${title}`}
          >
            <MdClose aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>,
    document.body,
  );
}
