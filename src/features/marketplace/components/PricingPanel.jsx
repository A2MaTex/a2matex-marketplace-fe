import { FiAlertCircle, FiCheckCircle, FiLock, FiRefreshCw } from "react-icons/fi";
import Button from "@/common/components/common/Button";
import { hasActiveProductAccess } from "@/features/commerce/model/entitlementAccess";
import { formatBalance, isZeroAmount } from "@/features/commerce/model/money";
import { formatOfferDuration, formatVnd } from "../utils/formatVnd";
import styles from "./PricingPanel.module.css";

export default function PricingPanel({
  offer,
  productId,
  purchase,
  isAuthenticated,
  balance,
  activeEntitlements = [],
  currentOfferId = null,
  accessLoading,
  accessError,
  onRetryAccess,
}) {
  const offerBlocked = purchase.blockedOfferIds.has(offer.id);
  const blocked = offerBlocked || purchase.productPurchaseBlocked;
  const hasCurrentAccess = hasActiveProductAccess(
    activeEntitlements,
    productId,
  );
  const isCurrentOffer =
    hasCurrentAccess && currentOfferId === offer.id;
  const isLockedOffer = hasCurrentAccess && !isCurrentOffer;
  const checkingAccess =
    isAuthenticated && accessLoading && !hasCurrentAccess;
  const accessCheckFailed =
    isAuthenticated && Boolean(accessError) && !hasCurrentAccess;
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

      {isAuthenticated && !hasCurrentAccess ? (
        <div className={styles.balance}>
          <span>Available balance</span>
          <strong>{formatBalance(balance)} VND</strong>
        </div>
      ) : null}

      {!hasCurrentAccess && !checkingAccess && !accessCheckFailed && purchase.hasUnresolvedOrderIntent ? (
        <div className={styles.pendingNote}>
          <FiRefreshCw aria-hidden="true" />
          <p>
            A previous checkout did not receive a conclusive response. Its
            original request key is preserved for safe review.
          </p>
        </div>
      ) : null}

      {!hasCurrentAccess && !checkingAccess && !accessCheckFailed && blocked ? (
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
          size="lg"
          leftIcon={<FiLock />}
          className={styles.purchaseButton}
        >
          Sign in to purchase
        </Button>
      ) : checkingAccess ? (
        <Button
          size="lg"
          loading
          disabled
          className={styles.purchaseButton}
        >
          Checking access
        </Button>
      ) : accessCheckFailed ? (
        <Button
          size="lg"
          leftIcon={<FiRefreshCw />}
          onClick={onRetryAccess}
          className={styles.purchaseButton}
        >
          Retry access check
        </Button>
      ) : isCurrentOffer ? (
        <Button
          href="/my-products"
          size="lg"
          leftIcon={<FiCheckCircle />}
          className={styles.purchaseButton}
        >
          View in My Products
        </Button>
      ) : isLockedOffer ? (
        <Button
          size="lg"
          disabled
          leftIcon={<FiLock />}
          className={`${styles.purchaseButton} ${styles.lockedButton}`}
        >
          Locked
        </Button>
      ) : purchase.hasUnresolvedOrderIntent ? (
        <Button
          size="lg"
          leftIcon={<FiRefreshCw />}
          onClick={purchase.reviewPendingPurchase}
          className={styles.purchaseButton}
        >
          Review pending purchase
        </Button>
      ) : (
        <Button
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
        {isCurrentOffer
          ? "This package matches your latest paid order."
          : isLockedOffer
            ? "Current access must end before another package can be purchased."
            : "The server verifies the current price and access eligibility."}
      </p>
    </aside>
  );
}
