import { FiAlertCircle, FiCheckCircle, FiLock, FiRefreshCw } from "react-icons/fi";
import Button from "@/common/components/common/Button";
import { formatBalance, isZeroAmount } from "@/features/commerce/model/money";
import { formatOfferDuration, formatVnd } from "../utils/formatVnd";
import styles from "./PricingPanel.module.css";

export default function PricingPanel({
  offer,
  productId,
  purchase,
  isAuthenticated,
  balance,
}) {
  const offerBlocked = purchase.blockedOfferIds.has(offer.id);
  const blocked = offerBlocked || purchase.productPurchaseBlocked;
  const returnTo = `/products/${productId}`;

  return (
    <aside className={styles.panel} aria-label="Selected offer summary">
      <span className={styles.eyebrow}>Offer summary</span>
      <h2>{offer.type === "ONE_TIME" ? "One-time access" : "Subscription access"}</h2>
      <div className={styles.price}>{formatVnd(offer.priceAmount)}</div>

      <dl className={styles.details}>
        <div><dt>Access period</dt><dd>{formatOfferDuration(offer)}</dd></div>
        <div><dt>Offer type</dt><dd>{offer.type === "ONE_TIME" ? "One-time" : "Recurring period"}</dd></div>
      </dl>

      <div className={styles.selectedNote}>
        <FiCheckCircle aria-hidden="true" />
        <span>This is the offer currently selected above.</span>
      </div>

      {isAuthenticated ? (
        <div className={styles.balance}>
          <span>Available balance</span>
          <strong>{formatBalance(balance)} VND</strong>
        </div>
      ) : null}

      {purchase.hasPendingPurchase ? (
        <div className={styles.pendingNote}>
          <FiRefreshCw aria-hidden="true" />
          <p>A protected purchase is waiting for your review. Its original request key is preserved.</p>
        </div>
      ) : null}

      {blocked ? (
        <div className={styles.blockedNote} role="status">
          <FiAlertCircle aria-hidden="true" />
          <p>
            {purchase.productPurchaseBlocked
              ? "Purchasing is unavailable for this product. Contact support for help with revoked access."
              : "This one-time offer was already used. Choose a subscription offer instead."}
          </p>
        </div>
      ) : null}

      {!isAuthenticated ? (
        <Button
          href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
          fullWidth
          size="lg"
          leftIcon={<FiLock />}
          className={styles.purchaseButton}
        >
          Sign in to purchase
        </Button>
      ) : purchase.hasPendingPurchase ? (
        <Button
          fullWidth
          size="lg"
          leftIcon={<FiRefreshCw />}
          onClick={purchase.reviewPendingPurchase}
          className={styles.purchaseButton}
        >
          Review pending purchase
        </Button>
      ) : (
        <Button
          fullWidth
          size="lg"
          disabled={blocked}
          leftIcon={<FiLock />}
          onClick={() => purchase.openConfirmation(offer)}
          className={styles.purchaseButton}
        >
          {isZeroAmount(offer.priceAmount) ? "Get access" : "Buy now"}
        </Button>
      )}

      <p className={styles.purchaseFootnote}>
        Secure, immediate purchase. The server verifies the current price and access eligibility.
      </p>
    </aside>
  );
}
