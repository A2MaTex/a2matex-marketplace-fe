import { useState } from "react";
import { IoStarSharp, IoStarOutline, IoThumbsUpOutline } from "react-icons/io5";
import { BsCpuFill } from "react-icons/bs";
import { MdOutlineMonitor } from "react-icons/md";
import Button from "@components/common/Button";
import styles from "./ReviewSection.module.css";

/* ── Helpers ── */
const Stars = ({ value, size = 14, interactive = false, onChange }) => (
  <span className={styles.stars}>
    {[1, 2, 3, 4, 5].map((n) =>
      value >= n ? (
        <IoStarSharp
          key={n}
          size={size}
          color="#00e5cc"
          style={interactive ? { cursor: "pointer" } : {}}
          onClick={() => interactive && onChange?.(n)}
        />
      ) : (
        <IoStarOutline
          key={n}
          size={size}
          color="#2e3448"
          style={interactive ? { cursor: "pointer" } : {}}
          onClick={() => interactive && onChange?.(n)}
        />
      ),
    )}
  </span>
);

const RATING_BARS = [
  { star: 5, pct: 92 },
  { star: 4, pct: 6 },
  { star: 3, pct: 2 },
  { star: 2, pct: 0 },
  { star: 1, pct: 0 },
];

const MOCK_REVIEWS = [
  {
    id: 1,
    username: "krypto_xenon",
    initials: "KX",
    rating: 5,
    time: "2 hours ago",
    body: "Been executing 140+ concurrent instances across AWS nodes with residential proxy chains. The canvas fingerprint evasion is completely undetectable by current Cloudflare & Turnstile sweeps. OTA updater dispatched hotfix in under 20 mins yesterday.",
    helpful: 42,
    meta: [
      { icon: <BsCpuFill size={11} />, text: "Benchmark: 99.84% Pass Rate" },
    ],
  },
  {
    id: 2,
    username: "nexus_runner",
    initials: "NR",
    rating: 4,
    time: "Yesterday",
    body: "The memory footprint optimizations are genuine. Other Electron/Playwright bots leak 300MB+ per thread, but this Rust-backed Chromium bridge stays flat under 50MB. Sub-keys feature makes team delegation seamless.",
    helpful: 19,
    meta: [
      {
        icon: <MdOutlineMonitor size={12} />,
        text: "HWID Synced via ExeFlow IPC",
      },
    ],
  },
];

const ReviewSection = () => {
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  return (
    <div className={styles.wrap}>
      {/* Section label */}
      <div className={styles.sectionLabel}>
        <span className={styles.labelAccent}>VERIFIED PURCHASER FEEDBACK</span>
        <h2 className={styles.heading}>Community Ratings & Reviews</h2>
      </div>

      {/* ── Rating summary ── */}
      <div className={styles.summary}>
        {/* Big score */}
        <div className={styles.scoreBlock}>
          <span className={styles.scoreValue}>4.96</span>
          <span className={styles.scoreTotal}>&nbsp;/ 5.0</span>
          <div className={styles.scoreStars}>
            <Stars value={5} size={18} />
          </div>
          <p className={styles.scoreSub}>Based on 348 verified nodes</p>
        </div>

        {/* Bar breakdown */}
        <div className={styles.bars}>
          {RATING_BARS.map(({ star, pct }) => (
            <div key={star} className={styles.barRow}>
              <span className={styles.barLabel}>{star}</span>
              <IoStarSharp size={11} color="#f59e0b" />
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${pct}%`, opacity: pct === 0 ? 0.15 : 1 }}
                />
              </div>
              <span className={styles.barPct}>{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Review form ── */}
      <div className={styles.formWrap}>
        <div className={styles.formHeader}>
          <span className={styles.formLabel}>Post Verified User Review</span>
          <span className={styles.formRating}>
            Rating:{" "}
            <Stars
              value={reviewRating}
              size={14}
              interactive
              onChange={setReviewRating}
            />
          </span>
        </div>
        <textarea
          className={styles.textarea}
          placeholder="Share execution latency, proxy handling observations, or patch feedback..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
        />
        <div className={styles.formFooter}>
          <Button variant="primary" size="sm">
            Submit Review
          </Button>
        </div>
      </div>

      {/* ── Review list ── */}
      <div className={styles.reviewList}>
        {MOCK_REVIEWS.map((r) => (
          <div key={r.id} className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <div className={styles.avatar}>{r.initials}</div>
              <div className={styles.reviewMeta}>
                <span className={styles.username}>{r.username}</span>
                <Stars value={r.rating} size={12} />
              </div>
              <span className={styles.reviewTime}>{r.time}</span>
            </div>

            <p className={styles.reviewBody}>{r.body}</p>

            <div className={styles.reviewFooter}>
              <button type="button" className={styles.helpfulBtn}>
                <IoThumbsUpOutline size={12} />
                {r.helpful} developers found this helpful
              </button>
              {r.meta.map((m, i) => (
                <span key={i} className={styles.reviewTag}>
                  {m.icon} {m.text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSection;
