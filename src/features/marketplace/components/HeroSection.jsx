import { GoDotFill } from "react-icons/go";
import styles from "./HeroSection.module.css";
import { FiTrendingUp } from "react-icons/fi";

const STATS = [
  {
    value: "1,420+",
    label: "Active .EXE Tools",
    icon: <FiTrendingUp size={16} color="#00e5cc" />,
  },
  {
    value: "1.020K+",
    label: "Active Publisher",
    icon: <GoDotFill size={14} color="#00e5cc" />,
  },
];

const HeroSection = () => (
  <section className={styles.hero}>
    <div className={styles.inner}>
      {/* Text block */}
      <div className={styles.text}>
        <h1 className={styles.heading}>
          Automate Everything.
          <br />
          <span className={styles.accent}>Verified Executable Tools.</span>
        </h1>
        <p className={styles.sub}>
          Acquire standalone compiled production bots, headless automators, and
          scrapers. Every .exe is audited against 70+ AV scanners and
          synchronized with your local A2MaTeX Client Launcher in 1-click.
        </p>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        {STATS.map(({ value, label, icon }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statValue}>{value}</span>
              <span className={styles.statIcon}>{icon}</span>
            </div>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div>
    </div>

    <div className={styles.glow} aria-hidden="true" />
  </section>
);

export default HeroSection;
