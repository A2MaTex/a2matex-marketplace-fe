import { useState } from "react";
import { IoShieldCheckmarkOutline, IoInformationCircleOutline } from "react-icons/io5";
import { MdOutlineLocalOffer } from "react-icons/md";
import Button from "../../../common/components/common/Button";
import styles from "./PricingPanel.module.css";

const PricingPanel = ({ price = 199, credits = 1990 }) => {
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    if (promo.trim()) setApplied(true);
  };

  return (
    <aside className={styles.panel}>
      <h2 className={styles.heading}>Provisioning Ledger</h2>

      {/* Line items */}
      <div className={styles.lines}>
        <div className={styles.lineItem}>
          <span className={styles.lineLabel}>Annual Scaler License</span>
          <span className={styles.lineValue}>${price.toFixed(2)}</span>
        </div>
        <div className={styles.lineItem}>
          <span className={styles.lineLabelMuted}>
            Tax <IoInformationCircleOutline size={13} style={{ verticalAlign: "middle" }} />
          </span>
          <span className={styles.lineFree}>FREE ($0.00)</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Promo code */}
      <div className={styles.promoRow}>
        <div className={styles.promoInputWrap}>
          <MdOutlineLocalOffer size={14} className={styles.promoIcon} />
          <input
            type="text"
            className={styles.promoInput}
            placeholder="PROMO / DEV CODE"
            value={promo}
            onChange={(e) => { setPromo(e.target.value); setApplied(false); }}
          />
        </div>
        <button
          type="button"
          className={[styles.applyBtn, applied ? styles.applied : ""].filter(Boolean).join(" ")}
          onClick={handleApply}
        >
          {applied ? "✓" : "APPLY"}
        </button>
      </div>

      <div className={styles.divider} />

      {/* Total */}
      <div className={styles.totalBlock}>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>TOTAL PAYABLE</span>
          <span className={styles.totalValue}>${price.toFixed(2)}</span>
        </div>
        <div className={styles.creditsRow}>
          <span className={styles.creditsLabel}>A2MaTeX Credit Equivalency</span>
          <span className={styles.creditsValue}>= {credits.toLocaleString()} A2MaTeX CR</span>
        </div>
      </div>

      {/* CTA */}
      <Button variant="primary" size="lg" fullWidth>
        Purchase Right Now
      </Button>
    </aside>
  );
};

export default PricingPanel;
