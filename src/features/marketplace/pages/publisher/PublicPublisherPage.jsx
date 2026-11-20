import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCompass,
  FiGithub,
  FiGlobe,
  FiInstagram,
  FiLinkedin,
  FiRefreshCw,
  FiTwitter,
  FiUser,
} from "react-icons/fi";
import { usePublicPublisher } from "../../hooks/usePublicPublisher";
import { buildMarketplaceImageUrl } from "../../utils/marketplaceMedia";
import { safeExternalUrl } from "../../utils/marketplaceLinks";
import styles from "./PublicPublisherPage.module.css";

const SOCIAL_LINKS = [
  { key: "website", label: "Website", icon: FiGlobe },
  { key: "github", label: "GitHub", icon: FiGithub },
  { key: "linkedin", label: "LinkedIn", icon: FiLinkedin },
  { key: "twitter", label: "X / Twitter", icon: FiTwitter },
  { key: "instagram", label: "Instagram", icon: FiInstagram },
];

const initials = (value) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";

function PublisherAvatar({ publisher }) {
  const [failedStaticId, setFailedStaticId] = useState(null);
  const failed = failedStaticId === publisher.avatarStaticId;

  if (!publisher.avatarStaticId || failed) {
    return <span aria-hidden="true">{initials(publisher.fullName)}</span>;
  }

  return (
    <img
      src={buildMarketplaceImageUrl(publisher.avatarStaticId, "small")}
      alt=""
      onError={() => setFailedStaticId(publisher.avatarStaticId)}
    />
  );
}

function PublisherState({ title, message, retryable = false, onRetry }) {
  return (
    <main className={styles.statePage}>
      <section className={styles.stateCard} role="alert">
        <FiAlertTriangle aria-hidden="true" />
        <span className={styles.stateCode}>PROFILE SIGNAL UNAVAILABLE</span>
        <h1>{title}</h1>
        <p>{message}</p>
        <div className={styles.stateActions}>
          <Link to="/">Marketplace</Link>
          {retryable ? (
            <button type="button" onClick={onRetry}>
              <FiRefreshCw aria-hidden="true" /> Try again
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default function PublicPublisherPage() {
  const { username = "" } = useParams();
  const validUsername = username.trim().length > 0 && username.length <= 255;
  const { data: publisher, loading, error, refetch } = usePublicPublisher(
    validUsername ? username : null,
  );

  const links = useMemo(
    () =>
      publisher
        ? SOCIAL_LINKS.map((item) => ({
            ...item,
            href: safeExternalUrl(publisher[item.key]),
          })).filter((item) => item.href)
        : [],
    [publisher],
  );

  useEffect(() => {
    const previousTitle = document.title;
    if (publisher) {
      document.title = `${publisher.fullName} · A2MaTeX Marketplace`;
    }
    return () => {
      document.title = previousTitle;
    };
  }, [publisher]);

  if (!validUsername) {
    return (
      <PublisherState
        title="Invalid publisher link"
        message="This marketplace link does not contain a valid publisher username."
      />
    );
  }

  if (loading && !publisher) {
    return (
      <main className={styles.page} aria-busy="true" aria-label="Loading publisher">
        <div className={styles.container}>
          <div className={styles.loadingHero} />
          <div className={styles.loadingGrid}>
            <div />
            <div />
          </div>
        </div>
      </main>
    );
  }

  if (error || !publisher) {
    const notFound =
      error?.status === 404 || error?.code === "Error.PublicPublisherNotFound";
    return (
      <PublisherState
        title={notFound ? "Publisher unavailable" : "Unable to load publisher"}
        message={error?.message ?? "This publisher is not available."}
        retryable={Boolean(error?.retryable)}
        onRetry={refetch}
      />
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.gridBackdrop} aria-hidden="true" />
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/">Marketplace</Link>
          <span>/</span>
          <span aria-current="page">@{publisher.username}</span>
        </nav>

        <header className={styles.profileHeader}>
          <div className={styles.signalBar} aria-hidden="true">
            <span>INDEPENDENT CREATOR</span>
            <span>PUBLIC PROFILE</span>
          </div>
          <div className={styles.identity}>
            <div className={styles.avatar}>
              <PublisherAvatar publisher={publisher} />
            </div>
            <div className={styles.identityCopy}>
              <span className={styles.eyebrow}>A2MATEX CREATOR PROFILE</span>
              <h1>{publisher.fullName}</h1>
              <p>@{publisher.username}</p>
            </div>
            <div className={styles.statusBadge}>
              <span aria-hidden="true" /> Public profile
            </div>
          </div>
        </header>

        <div className={styles.contentGrid}>
          <section className={styles.panel} aria-labelledby="publisher-about-heading">
            <div className={styles.panelLabel}>01 / PROFILE DATA</div>
            <div className={styles.panelHeading}>
              <FiUser aria-hidden="true" />
              <h2 id="publisher-about-heading">About the publisher</h2>
            </div>
            <p className={publisher.bio ? styles.bio : styles.emptyCopy}>
              {publisher.bio || "This publisher has not added a public bio yet."}
            </p>
          </section>

          <aside className={styles.panel} aria-labelledby="publisher-links-heading">
            <div className={styles.panelLabel}>02 / EXTERNAL CHANNELS</div>
            <div className={styles.panelHeading}>
              <FiGlobe aria-hidden="true" />
              <h2 id="publisher-links-heading">Publisher links</h2>
            </div>
            {links.length ? (
              <div className={styles.links}>
                {links.map(({ key, label, href, icon: Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>
                      <Icon aria-hidden="true" /> {label}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className={styles.emptyCopy}>
                No public links have been shared on this profile.
              </p>
            )}
          </aside>
        </div>

        <section className={styles.catalogCallout}>
          <div>
            <span>CONTINUE EXPLORING</span>
            <h2>Discover the wider automation catalog.</h2>
            <p>
              This public profile introduces the creator. Browse Marketplace to
              discover the currently published tools and releases.
            </p>
          </div>
          <Link to="/">
            <FiCompass aria-hidden="true" /> Browse tools
          </Link>
        </section>
      </div>
    </main>
  );
}
