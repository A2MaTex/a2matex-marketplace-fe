import { FiClock } from "react-icons/fi";
import styles from "./PublisherSectionPlaceholder.module.css";

const PublisherSectionPlaceholder = ({ eyebrow, title, description }) => (
  <section className={styles.page}>
    <div className={styles.card}>
      <span className={styles.icon} aria-hidden="true">
        <FiClock size={19} />
      </span>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1>{title}</h1>
      <p className={styles.description}>{description}</p>
      <span className={styles.badge}>COMING SOON</span>
    </div>
  </section>
);

export default PublisherSectionPlaceholder;
