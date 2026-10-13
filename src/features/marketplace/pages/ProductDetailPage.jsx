import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  IoStarSharp,
  IoShieldCheckmarkOutline,
  IoDownloadOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { MdOutlineTerminal, MdVerified } from "react-icons/md";
import { FiZap } from "react-icons/fi";
import AppLayout from "../../../common/components/layout/AppLayout";
import PricingPanel from "../components/PricingPanel";
import LicenseTier from "../components/LicenseTier";
import ReviewSection from "../components/ReviewSection";
import styles from "./ProductDetailPage.module.css";

/* ── Mock data (replace with real API call) ── */
const MOCK_PRODUCT = {
  id: "1",
  title: "A2MaTeX Multi-Threaded Browser & API Automation Engine",
  version: "v2.4.8 PRO",
  author: "DevX Core Labs",
  authorVerified: true,
  downloads: "1.5k+",
  rating: 4.96,
  reviews: 348,
  shortDesc:
    "High-throughput distributed browser orchestrator and protocol reverse-engineering suite. Designed for automated queue dispatch, multi-account profile lifecycle management, algorithmic rotation, and headless task scheduling across isolated sandbox containers.",
  longDesc:
    "High-throughput distributed browser orchestrator and protocol reverse-engineering suite. Designed for automated queue dispatch, multi-account profile lifecycle management, algorithmic rotation, and headless task scheduling across isolated sandbox containers.\nHigh-throughput distributed browser orchestrator and protocol reverse-engineering suite. Designed for automated queue dispatch, multi-account profile lifecycle management, algorithmic rotation, and headless task scheduling across isolated sandbox containers.\nHigh-throughput distributed browser orchestrator and protocol reverse-engineering suite. Designed for automated queue dispatch, multi-account profile lifecycle management, algorithmic rotation...",
  price: 199,
  credits: 1990,
};

const ProductDetailPage = () => {
  const { productId } = useParams();
  const product = MOCK_PRODUCT; // TODO: fetch by productId

  const [expanded, setExpanded] = useState(false);
  const [selectedTier, setSelectedTier] = useState("annual");

  const shortLines = product.longDesc.split("\n").slice(0, 2).join("\n");

  return (
    <AppLayout>
      <div className={styles.page}>
        <div className={styles.container}>

          {/* ── Breadcrumb ── */}
          <nav className={styles.breadcrumb} aria-label="breadcrumb">
            <Link to="/" className={styles.breadLink}>Marketplace</Link>
            <IoChevronForwardOutline size={12} className={styles.breadSep} />
            <span className={styles.breadCurrent}>Product Detail</span>
          </nav>

          {/* ── Main 2-col layout ── */}
          <div className={styles.layout}>

            {/* ══ LEFT COLUMN ══ */}
            <div className={styles.left}>

              {/* Product header card */}
              <div className={styles.headerCard}>
                {/* Title row */}
                <div className={styles.titleRow}>
                  <div className={styles.productIcon}>
                    <MdOutlineTerminal size={28} />
                  </div>
                  <div className={styles.titleBlock}>
                    <div className={styles.titleMeta}>
                      <h1 className={styles.title}>{product.title}</h1>
                      <span className={styles.versionBadge}>{product.version}</span>
                    </div>
                    <div className={styles.authorRow}>
                      <span className={styles.authorText}>by {product.author}</span>
                      {product.authorVerified && (
                        <span className={styles.verifiedBadge}>
                          <MdVerified size={13} />
                          Verified Studio
                        </span>
                      )}
                      <span className={styles.dot}>•</span>
                    </div>
                    <div className={styles.ratingRow}>
                      <IoStarSharp size={14} color="#00e5cc" />
                      <IoStarSharp size={14} color="#00e5cc" />
                      <IoStarSharp size={14} color="#00e5cc" />
                      <IoStarSharp size={14} color="#00e5cc" />
                      <IoStarSharp size={14} color="#00e5cc" />
                      <span className={styles.ratingVal}>{product.rating}</span>
                      <span className={styles.ratingCount}>
                        ({product.reviews} verified reviews)
                      </span>
                    </div>
                  </div>
                  <div className={styles.downloadsBadge}>
                    <IoShieldCheckmarkOutline size={14} />
                    <span>{product.downloads} downloads</span>
                  </div>
                </div>

                {/* Short description */}
                <p className={styles.shortDesc}>{product.shortDesc}</p>

                {/* Detail description (expandable) */}
                <div className={styles.detailBlock}>
                  <span className={styles.detailLabel}>
                  <FiZap size={11} /> DETAIL DESCRIPTION
                  </span>
                  <p className={styles.detailText}>
                    {expanded ? product.longDesc : shortLines}
                    {!expanded && (
                      <button
                        type="button"
                        className={styles.moreBtn}
                        onClick={() => setExpanded(true)}
                      >
                        ...more
                      </button>
                    )}
                  </p>
                </div>
              </div>

              {/* License tier selector */}
              <div className={styles.section}>
                <LicenseTier onSelect={setSelectedTier} />
              </div>

              {/* Reviews */}
              <div className={styles.section}>
                <ReviewSection />
              </div>
            </div>

            {/* ══ RIGHT COLUMN (sticky sidebar) ══ */}
            <div className={styles.right}>
              <PricingPanel price={product.price} credits={product.credits} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductDetailPage;
