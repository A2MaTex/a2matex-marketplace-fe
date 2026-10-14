import { useState } from "react";
import ProductCard from "./ProductCard";
import styles from "./ProductGrid.module.css";

const SORT_OPTIONS = ["Most Popular", "Alphabet A-Z", "New Release"];

/* ── Mock data ── */
const MOCK_PRODUCTS = [
  {
    id: "1",
    title: "TikTok Auto-Uploader & Farm Pro",
    author: "DevX Labs",
    description:
      "High-throughput automation worker with automated caption generation, smart schedule queueing, audio track randomizer, and session isolation. Fully native Win32 .exe compiled binary.",
    price: 29,
    lifetimePrice: 199,
    rating: 4.8,
    reviews: 898,
    badge: "Most Popular",
    featured: true,
    version: "v8.4.1",
  },
  {
    id: "2",
    title: "Shopee & Lazada Auto-Fulfill",
    author: "eComBots",
    description:
      "Synchronizes dropshipping inventory orders, binds multiple proxy pools, and automatically triggers OCR & AI captcha solver...",
    price: 45,
    rating: 4.8,
    reviews: 898,
    featured: false,
  },
  {
    id: "3",
    title: "Shopee & Lazada Auto-Fulfill",
    author: "eComBots",
    description:
      "Synchronizes dropshipping inventory orders, binds multiple proxy pools, and automatically triggers OCR & AI captcha solver...",
    price: 45,
    rating: 4.8,
    reviews: 898,
    featured: false,
  },
  {
    id: "4",
    title: "Shopee & Lazada Auto-Fulfill",
    author: "eComBots",
    description:
      "Synchronizes dropshipping inventory orders, binds multiple proxy pools, and automatically triggers OCR & AI captcha solver...",
    price: 45,
    rating: 4.8,
    reviews: 898,
    featured: false,
  },
  {
    id: "5",
    title: "Shopee & Lazada Auto-Fulfill",
    author: "eComBots",
    description:
      "Synchronizes dropshipping inventory orders, binds multiple proxy pools, and automatically triggers OCR & AI captcha solver...",
    price: 45,
    rating: 4.8,
    reviews: 898,
    featured: false,
  },
  {
    id: "6",
    title: "Shopee & Lazada Auto-Fulfill",
    author: "eComBots",
    description:
      "Synchronizes dropshipping inventory orders, binds multiple proxy pools, and automatically triggers OCR & AI captcha solver...",
    price: 45,
    rating: 4.8,
    reviews: 898,
    featured: false,
  },
  {
    id: "7",
    title: "Shopee & Lazada Auto-Fulfill",
    author: "eComBots",
    description:
      "Synchronizes dropshipping inventory orders, binds multiple proxy pools, and automatically triggers OCR & AI captcha solver...",
    price: 45,
    rating: 4.8,
    reviews: 898,
    featured: false,
  },
];

const ProductGrid = ({ products = MOCK_PRODUCTS, total = 1420 }) => {
  const [sort, setSort] = useState("Most Popular");

  const featured = products.find((p) => p.featured);
  const rest = products.filter((p) => !p.featured);

  return (
    <div className={styles.wrap}>
      {/* ── Controls bar ── */}
      <div className={styles.controls}>
        <p className={styles.count}>
          Showing <strong>{products.length}</strong> Verified Executables of{" "}
          <strong>{total.toLocaleString()}</strong>
        </p>

        <div className={styles.sortRow}>
          <span className={styles.sortLabel}>SORT BY:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={[styles.sortBtn, sort === opt ? styles.sortActive : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSort(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className={styles.grid}>
        {/* Featured card spans full left column (2 rows on desktop) */}
        {featured && (
          <div className={styles.featuredSlot}>
            <ProductCard {...featured} />
          </div>
        )}

        {/* Regular cards fill remaining slots */}
        {rest.map((product) => (
          <div key={product.id} className={styles.regularSlot}>
            <ProductCard {...product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
