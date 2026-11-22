import { Link } from "react-router-dom";
import { FiArrowUpRight, FiLayers, FiSearch, FiZap } from "react-icons/fi";
import logo from "@/assets/text-logo.svg";
import styles from "../styles/AuthPageLayout.module.css";

const AuthPageLayout = ({ eyebrow, headline, highlight, description, children }) => (
  <div className={styles.root}>
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link to="/" className={styles.logo} aria-label="A2MaTeX home">
          <img src={logo} alt="A2MaTeX" />
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          <Link to="/" className={styles.navLink}>Marketplace</Link>
          <Link to="/launcher" className={styles.navLink}>Desktop Launcher</Link>
          <Link to="/studio" className={styles.navLink}>Studio</Link>
        </nav>

        <Link to="/" className={styles.marketplaceLink}>
          Back to Marketplace <FiArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </header>

    <main className={styles.page}>
      <div className={styles.ambientGrid} aria-hidden="true" />
      <div className={styles.ambientGlow} aria-hidden="true" />

      <div className={styles.content}>
        <section className={styles.story} aria-labelledby="auth-story-title">
          <div className={styles.eyebrow}>
            <span className={styles.liveDot} />
            {eyebrow}
          </div>
          <h1 className={styles.storyTitle} id="auth-story-title">
            {headline}
            <span>{highlight}</span>
          </h1>
          <p className={styles.storyCopy}>{description}</p>

          <div className={styles.capabilities}>
            <div className={styles.capability}>
              <span className={styles.capabilityIcon}><FiSearch aria-hidden="true" /></span>
              <span>Explore workflows</span>
            </div>
            <div className={styles.capability}>
              <span className={styles.capabilityIcon}><FiLayers aria-hidden="true" /></span>
              <span>Build in Studio</span>
            </div>
            <div className={styles.capability}>
              <span className={styles.capabilityIcon}><FiZap aria-hidden="true" /></span>
              <span>Run with Launcher</span>
            </div>
          </div>
        </section>

        <section className={styles.formPanel} aria-label="Account access">
          {children}
        </section>
      </div>
    </main>
  </div>
);

export default AuthPageLayout;
