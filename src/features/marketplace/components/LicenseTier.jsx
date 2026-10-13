import { useState } from "react";
import { FiZap } from "react-icons/fi";
import { IoFlashOutline } from "react-icons/io5";
import styles from "./LicenseTier.module.css";

const TIERS = [
  {
    id: "monthly",
    tag: "STANDARD",
    flex: "Flex",
    name: "Monthly",
    price: 29,
    unit: "/ month",
    sub: "Billed monthly",
    recommended: false,
  },
  {
    id: "annual",
    tag: "SCALER PRO",
    name: "Annual Scaler",
    price: 199,
    unit: "/ year",
    sub: "$16.58 / mo equivalent",
    recommended: true,
    savePct: "SAVE 42%",
  },
  {
    id: "lifetime",
    tag: "UNLIMITED",
    flex: "One-Time",
    name: "Lifetime Farm",
    price: 499,
    unit: "once",
    sub: "Pay once, keep forever",
    recommended: false,
  },
];

const LicenseTier = ({ onSelect }) => {
  const [selected, setSelected] = useState("annual");

  const handleSelect = (id) => {
    setSelected(id);
    onSelect?.(id);
  };

  return (
    <div className={styles.wrap}>
      {/* Section label */}
      <div className={styles.sectionLabel}>
        <span className={styles.labelAccent}>CONFIGURE ACCESS PERMISSIONS</span>
        <h2 className={styles.heading}>Select License Activation Tier</h2>
      </div>

      <div className={styles.meta}>
        <span className={styles.metaTag}>Tax Included · Instant Release</span>
      </div>

      <div className={styles.grid}>
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            type="button"
            className={[
              styles.card,
              selected === tier.id ? styles.selected : "",
              tier.recommended ? styles.recommended : "",
            ].filter(Boolean).join(" ")}
            onClick={() => handleSelect(tier.id)}
          >
            {/* Recommended badge */}
            {tier.recommended && (
              <div className={styles.recommendedBadge}>
                <IoFlashOutline size={11} />
                RECOMMENDED · {tier.savePct}
              </div>
            )}

            <div className={styles.cardInner}>
              {/* Tag row */}
              <div className={styles.tagRow}>
                <span className={styles.tag}>{tier.tag}</span>
                {tier.flex && <span className={styles.flex}>{tier.flex}</span>}
                {tier.recommended && (
                  <span className={styles.zapIcon}>
                    <FiZap size={12} />
                  </span>
                )}
              </div>

              {/* Name */}
              <p className={styles.tierName}>{tier.name}</p>

              {/* Price */}
              <div className={styles.priceRow}>
                <span className={styles.price}>${tier.price}</span>
                <span className={styles.unit}>{tier.unit}</span>
              </div>

              {/* Sub note */}
              <p className={[styles.sub, tier.recommended ? styles.subHighlight : ""].filter(Boolean).join(" ")}>
                {tier.sub}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LicenseTier;
