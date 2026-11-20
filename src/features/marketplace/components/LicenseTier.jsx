import { FiCheck, FiClock } from "react-icons/fi";
import { MdAllInclusive } from "react-icons/md";
import { formatOfferDuration, formatVnd } from "../utils/formatVnd";
import styles from "./LicenseTier.module.css";

export default function LicenseTier({ offers, selectedOfferId, onSelect }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.sectionLabel}>
        <span className={styles.labelAccent}>Available access</span>
        <h2 className={styles.heading}>Choose an offer</h2>
        <p>Compare the publisher&apos;s currently available access options.</p>
      </div>

      <div className={styles.grid}>
        {offers.map((offer) => {
          const selected = offer.id === selectedOfferId;
          const isLifetime = offer.type === "ONE_TIME";
          return (
            <button
              key={offer.id}
              type="button"
              className={selected ? styles.selected : styles.card}
              onClick={() => onSelect(offer.id)}
              aria-pressed={selected}
            >
              <span className={styles.offerType}>
                {isLifetime ? <MdAllInclusive aria-hidden="true" /> : <FiClock aria-hidden="true" />}
                {isLifetime ? "One-time access" : "Subscription"}
              </span>
              <strong>{formatVnd(offer.priceAmount)}</strong>
              <span className={styles.duration}>{formatOfferDuration(offer)}</span>
              <span className={styles.selection}>
                {selected ? <FiCheck aria-hidden="true" /> : null}
                {selected ? "Selected" : "Select offer"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
