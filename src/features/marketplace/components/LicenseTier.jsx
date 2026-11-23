import { FiClock } from "react-icons/fi";
import { MdAllInclusive } from "react-icons/md";
import { formatOfferDuration, formatVnd } from "../utils/formatVnd";
import styles from "./LicenseTier.module.css";

export default function LicenseTier({
  offers,
  selectedOfferId,
  onSelect,
  currentOfferId = null,
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.sectionLabel}>
        <span className={styles.labelAccent}>Access plans</span>
        <h2 className={styles.heading}>Choose your package</h2>
        <p>Pick the access period that works best for you.</p>
      </div>

      <div className={styles.grid}>
        {offers.map((offer) => {
          const selected = offer.id === selectedOfferId;
          const current = offer.id === currentOfferId;
          const isLifetime = offer.type === "ONE_TIME";
          return (
            <button
              key={offer.id}
              type="button"
              className={`${styles.card} ${selected ? styles.selected : ""} ${current ? styles.currentPackage : ""}`}
              onClick={() => onSelect(offer.id)}
              aria-pressed={selected}
              aria-current={current ? "true" : undefined}
            >
              <span className={styles.cardHead}>
                <span className={styles.planIcon}>
                  {isLifetime ? <MdAllInclusive aria-hidden="true" /> : <FiClock aria-hidden="true" />}
                </span>
                <span className={styles.planName}>
                  <span className={styles.offerType}>{isLifetime ? "One-time access" : "Subscription"}</span>
                </span>
              </span>
              <span className={styles.price}>{formatVnd(offer.priceAmount)}</span>
              <span className={styles.duration}>
                {formatOfferDuration(offer)} access
              </span>
              <span className={styles.selection}>
                {current
                  ? "Your current package"
                  : selected
                      ? "Package selected"
                      : "Choose package"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
