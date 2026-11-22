import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiShield,
  FiX,
} from "react-icons/fi";
import Button from "@/common/components/common/Button";
import { formatOfferDuration } from "@/features/marketplace/utils/formatVnd";
import { formatBalance, formatVndAmount } from "../model/money";
import PurchaseResult from "./PurchaseResult";
import styles from "./PurchaseConfirmationDialog.module.css";

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function PurchaseConfirmationDialog({
  product,
  purchase,
  balance,
  returnTo,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const offer = purchase.activeOffer;
  const busy = purchase.phase === "submitting";

  useEffect(() => {
    if (!purchase.dialogOpen) return undefined;
    previousFocusRef.current = document.activeElement;
    const frame = requestAnimationFrame(() => {
      dialogRef.current?.querySelector(focusableSelector)?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      previousFocusRef.current?.focus?.();
    };
  }, [purchase.dialogOpen]);

  if (!purchase.dialogOpen) return null;

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && !busy) {
      purchase.closeDialog();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...dialogRef.current.querySelectorAll(focusableSelector)];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const renderActions = () => {
    if (purchase.phase === "success") {
      return <Button onClick={purchase.closeDialog}>Done</Button>;
    }
    if (purchase.phase === "intent_conflict") {
      return (
        <>
          <Button variant="ghost" onClick={purchase.reviewPendingPurchase}>
            Keep pending purchase
          </Button>
          <Button
            onClick={() =>
              purchase.discardPendingPurchase({ continueWithCandidate: true })
            }
          >
            Discard &amp; review new offer
          </Button>
        </>
      );
    }
    if (purchase.phase === "awaiting_topup") {
      return (
        <>
          <Button variant="ghost" onClick={purchase.closeDialog}>Close</Button>
          <Button onClick={purchase.openTopUp}>Add funds</Button>
        </>
      );
    }
    if (purchase.phase === "uncertain") {
      return (
        <>
          <Button variant="ghost" onClick={purchase.closeDialog}>Close</Button>
          <Button leftIcon={<FiRefreshCw />} onClick={purchase.retryPurchase}>
            Retry safely
          </Button>
        </>
      );
    }
    if (purchase.phase === "ready_retry") {
      return (
        <>
          <Button variant="ghost" onClick={purchase.closeDialog}>Close</Button>
          <Button leftIcon={<FiRefreshCw />} onClick={purchase.retryPurchase}>
            Retry protected purchase
          </Button>
        </>
      );
    }
    if (purchase.phase === "error") {
      const needsProfile =
        purchase.error?.code === "Error.OrderCustomerProfileNotFound";
      const needsLogin = purchase.error?.status === 401;
      return (
        <>
          <Button variant="ghost" onClick={purchase.closeDialog}>Close</Button>
          {needsProfile ? (
            <Button href={`/profile?returnTo=${encodeURIComponent(returnTo)}`}>
              Complete profile
            </Button>
          ) : null}
          {needsLogin ? (
            <Button href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>
              Sign in again
            </Button>
          ) : null}
        </>
      );
    }
    return (
      <>
        <Button variant="ghost" onClick={purchase.closeDialog} disabled={busy}>
          Cancel
        </Button>
        <Button
          className={styles.confirmButton}
          loading={busy}
          disabled={busy || !offer}
          leftIcon={<FiShield />}
          onClick={purchase.confirmPurchase}
        >
          {busy ? "Processing" : "Confirm purchase"}
        </Button>
      </>
    );
  };

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) purchase.closeDialog();
      }}
    >
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-dialog-title"
        aria-describedby="purchase-dialog-description"
        aria-busy={busy}
        onKeyDown={handleKeyDown}
      >
        <header className={styles.header}>
          <div className={styles.headingMark}><FiShield aria-hidden="true" /></div>
          <div>
            <span>Protected checkout</span>
            <h2 id="purchase-dialog-title">
              {purchase.phase === "success" ? "Access confirmed" : product.name}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={purchase.closeDialog}
            disabled={busy}
            aria-label="Close purchase dialog"
          >
            <FiX />
          </button>
        </header>

        <div className={styles.body}>
          {purchase.phase === "success" && purchase.result ? (
            <PurchaseResult
              result={purchase.result}
              profileRefreshFailed={purchase.profileRefreshFailed}
            />
          ) : purchase.phase === "intent_conflict" ? (
            <div className={styles.conflict} role="alert">
              <FiAlertTriangle aria-hidden="true" />
              <div>
                <h3>A purchase is already waiting</h3>
                <p>
                  A protected attempt for another offer is still unresolved.
                  Replacing it means you will no longer retry that attempt with
                  its original idempotency key.
                </p>
                {purchase.candidateOffer ? (
                  <strong>
                    New selection: {formatVndAmount(purchase.candidateOffer.priceAmount)} ·{" "}
                    {formatOfferDuration(purchase.candidateOffer)}
                  </strong>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              {offer ? (
                <div className={styles.summary}>
                  <div>
                    <span>Selected access</span>
                    <strong>
                      {offer.type === "ONE_TIME" ? "One-time access" : "Subscription"}
                    </strong>
                  </div>
                  <div>
                    <span>Duration</span>
                    <strong><FiClock aria-hidden="true" /> {formatOfferDuration(offer)}</strong>
                  </div>
                  <div className={styles.summaryPrice}>
                    <span>Server-listed price</span>
                    <strong>{formatVndAmount(offer.priceAmount)}</strong>
                  </div>
                </div>
              ) : (
                <div className={styles.conflict} role="alert">
                  <FiAlertTriangle aria-hidden="true" />
                  <div>
                    <h3>The original offer is no longer listed</h3>
                    <p>Retrying will let the server resolve the protected attempt safely.</p>
                  </div>
                </div>
              )}

              <div className={styles.balanceRow}>
                <span>Available balance</span>
                <strong>{formatBalance(purchase.latestBalance ?? balance)} VND</strong>
              </div>

              <p id="purchase-dialog-description" className={styles.serverNote}>
                <FiCheckCircle aria-hidden="true" />
                Price and eligibility are revalidated by the server when you
                confirm. The request contains only the selected offer ID.
              </p>

              {busy ? (
                <div className={styles.processing} role="status" aria-live="polite">
                  <span className={styles.spinner} aria-hidden="true" />
                  <div><strong>Confirming your purchase</strong><p>Keep this window open. Repeated clicks cannot create another request.</p></div>
                </div>
              ) : null}

              {purchase.phase === "uncertain" ? (
                <div className={styles.warning} role="alert">
                  <FiAlertTriangle aria-hidden="true" />
                  <div><strong>Outcome not confirmed</strong><p>{purchase.error?.message}</p><small>The retry keeps the same offer and protected request key.</small></div>
                </div>
              ) : null}

              {purchase.phase === "ready_retry" ? (
                <div className={styles.ready} role="status">
                  <FiCheckCircle aria-hidden="true" />
                  <div><strong>Ready to retry</strong><p>Your balance changed. Confirm again with the same protected request.</p></div>
                </div>
              ) : null}

              {purchase.phase === "awaiting_topup" ? (
                <div className={styles.warning} role="alert">
                  <FiAlertTriangle aria-hidden="true" />
                  <div><strong>More balance is required</strong><p>{purchase.error?.message}</p><small>Adding funds will not submit the order automatically.</small></div>
                </div>
              ) : null}

              {purchase.phase === "error" && purchase.error ? (
                <div className={styles.error} role="alert">
                  <FiAlertTriangle aria-hidden="true" />
                  <div><strong>Purchase not completed</strong><p>{purchase.error.message}</p></div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <Link to="/terms" className={styles.termsLink}>
            Purchase terms <FiArrowRight aria-hidden="true" />
          </Link>
          <div className={styles.actions}>{renderActions()}</div>
        </footer>
      </section>
    </div>
  );
}
