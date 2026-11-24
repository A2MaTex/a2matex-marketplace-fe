import { FiFileText, FiImage, FiPackage, FiPlayCircle } from "react-icons/fi";
import SafeProductContent from "@/features/marketplace/components/SafeProductContent";
import StaticImage from "@/features/publisher/pages/components/StaticImage";
import styles from "../page/AdminSubmissionReview.module.css";

const MediaGallery = ({ media }) => {
  if (!media.length) return <p className={styles.noMedia}>No frozen media assets.</p>;
  return (
    <div className={styles.mediaGrid}>
      {[...media]
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((asset) => (
          <figure key={asset.id}>
            <StaticImage
              staticId={asset.staticId}
              variant={asset.type === "ICON" ? "small" : "medium"}
              alt={asset.altText ?? ""}
              className={styles.mediaImage}
            />
            <figcaption><span>{asset.type}</span>{asset.altText || "No alt text"}</figcaption>
          </figure>
        ))}
    </div>
  );
};

export default function SubmissionSnapshot({ submission }) {
  const snapshot = submission.productSnapshot;
  const release = submission.releaseRequest;
  const context = submission.reviewContext;
  return (
    <div className={styles.evidenceStack}>
      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <span className={styles.panelIcon}><FiPackage /></span>
          <div><p>Immutable evidence</p><h2>Frozen Product snapshot</h2></div>
          <small>Schema v{snapshot.schemaVersion}</small>
        </header>
        <div className={styles.snapshotIntro}>
          <div><span>Name</span><strong>{snapshot.name}</strong></div>
          <div><span>Slug</span><strong>{snapshot.slug}</strong></div>
          <div className={styles.wideField}><span>Short description</span><p>{snapshot.shortDescription}</p></div>
        </div>
        <div className={styles.richTextGrid}>
          <article>
            <h3>Description</h3>
            <SafeProductContent value={snapshot.description} className={styles.safeContent} />
          </article>
          <article>
            <h3>Usage instructions</h3>
            {snapshot.usageInstructions ? (
              <SafeProductContent value={snapshot.usageInstructions} className={styles.safeContent} />
            ) : <p className={styles.mutedCopy}>Not provided.</p>}
          </article>
        </div>
        <div className={styles.mediaSection}>
          <h3><FiImage /> Frozen media <span>{snapshot.media.length}</span></h3>
          <MediaGallery media={snapshot.media} />
        </div>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <span className={styles.panelIcon}><FiPlayCircle /></span>
          <div><p>Build request</p><h2>Release evidence</h2></div>
          <small>Schema v{release.schemaVersion}</small>
        </header>
        <div className={styles.releaseMetrics}>
          <div><span>Requested version</span><strong>v{release.version}</strong></div>
          <div><span>Minimum Launcher</span><strong>≥ {release.minimumLauncherVersion}</strong></div>
          <div><span>Minimum Runtime</span><strong>≥ {release.minimumRuntimeVersion}</strong></div>
        </div>
        <div className={styles.proseBlock}><h3>Changelog</h3><p>{release.changelog}</p></div>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <span className={styles.panelIcon}><FiFileText /></span>
          <div><p>Publisher brief</p><h2>Review context</h2></div>
          <small>Schema v{context.schemaVersion}</small>
        </header>
        <div className={styles.contextGrid}>
          <article><h3>Purpose</h3><p>{context.purpose}</p></article>
          <article><h3>Test instructions</h3><p>{context.testInstructions}</p></article>
        </div>
        <div className={styles.proseBlock}>
          <h3>Known limitations</h3>
          {context.knownLimitations.length ? (
            <ul>{context.knownLimitations.map((item) => <li key={item}>{item}</li>)}</ul>
          ) : <p className={styles.mutedCopy}>No known limitations were declared.</p>}
        </div>
      </section>
    </div>
  );
}
