import { FiCheckCircle, FiInfo } from "react-icons/fi";
import { formatOfferDuration, formatVnd } from "../utils/formatVnd";
import styles from "./PricingPanel.module.css";

export default function PricingPanel({ offer }) {
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

      <div className={styles.checkoutNote}>
        <FiInfo aria-hidden="true" />
        <p>Checkout is not available yet. This page shows the publisher&apos;s public offer without starting a purchase.</p>
      </div>
    </aside>
  );
}
