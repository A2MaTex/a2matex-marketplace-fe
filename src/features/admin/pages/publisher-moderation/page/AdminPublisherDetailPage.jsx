import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiExternalLink,
  FiFileText,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiSlash,
  FiUser,
  FiUserCheck,
} from "react-icons/fi";
import { formatCommerceDate } from "@/features/commerce/model/date";
import { safeExternalUrl } from "@/features/marketplace/utils/marketplaceLinks";
import { buildMarketplaceImageUrl } from "@/features/marketplace/utils/marketplaceMedia";
import AdminUserStatusBadge from "../../user-manage/components/AdminUserStatusBadge";
import PublisherStatusBadge from "../components/PublisherStatusBadge";
import PublisherStatusDialog from "../components/PublisherStatusDialog";
import { useAdminPublisherDetail } from "../hooks/useAdminPublisherDetail";
import base from "../../user-manage/page/UserManage.module.css";
import styles from "./AdminPublisherModeration.module.css";

const formatDateTime = (value) =>
  value ? formatCommerceDate(value, { withTime: true }) : "Not recorded";

const displayValue = (value) => value || "Not provided";

const profileLinks = [
  ["Website", "website"],
  ["GitHub", "github"],
  ["LinkedIn", "linkedin"],
  ["X / Twitter", "twitter"],
  ["Instagram", "instagram"],
];

const termTypeLabel = {
  PUBLISHER_TERMS: "Publisher Terms",
  CUSTOMER_TERMS: "Customer Terms",
  PRIVACY_POLICY: "Privacy Policy",
};

function DetailField({ label, children, wide = false }) {
  return (
    <div className={wide ? base.detailFieldWide : base.detailField}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const initials = (publisher) => {
  const source = publisher.profile?.fullName || publisher.user.username || "P";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

function PublisherAvatar({ publisher }) {
  const [failed, setFailed] = useState(false);
  const staticId = publisher.profile?.avatarStaticId;
  if (!staticId || failed) {
    return (
      <div className={base.detailAvatarFallback}>{initials(publisher)}</div>
    );
  }
  return (
    <img
      className={base.detailAvatar}
      src={buildMarketplaceImageUrl(staticId, "small")}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}

function AcceptedTerms({ terms }) {
  if (terms.length === 0) {
    return (
      <div className={base.auditEmpty}>
        No Terms acceptance has been recorded for this Publisher account.
      </div>
    );
  }
  return (
    <ol className={base.auditList}>
      {terms.map((term) => (
        <li key={`${term.id}-${term.acceptedAt}`}>
          <span className={base.auditMarker} aria-hidden="true" />
          <div className={base.auditContent}>
            <div className={base.auditTitle}>
              <strong>{term.title}</strong>
              <time dateTime={term.acceptedAt}>{formatDateTime(term.acceptedAt)}</time>
            </div>
            <p>
              {termTypeLabel[term.type] ?? term.type} · Version {term.version}
            </p>
            <small>Term ID: {term.id}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function AdminPublisherDetailPage() {
  const { publisherAccountId } = useParams();
  const location = useLocation();
  const publisher = useAdminPublisherDetail(publisherAccountId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const backTo =
    typeof location.state?.from === "string" &&
    location.state.from.startsWith("/admin/publishers")
      ? location.state.from
      : "/admin/publishers";

  const safeLinks = useMemo(
    () =>
      publisher.data?.profile
        ? profileLinks
            .map(([label, key]) => ({
              label,
              href: safeExternalUrl(publisher.data.profile[key]),
            }))
            .filter((item) => item.href)
        : [],
    [publisher.data],
  );

  const sortedTerms = useMemo(
    () =>
      publisher.data
        ? [...publisher.data.acceptedTerms].sort(
            (left, right) => Date.parse(right.acceptedAt) - Date.parse(left.acceptedAt),
          )
        : [],
    [publisher.data],
  );

  if (publisher.loading && !publisher.data) {
    return (
      <div className={base.detailPage} aria-busy="true">
        <div className={base.detailSkeletonHeader} />
        <div className={base.detailSkeletonGrid}>
          <div />
          <div />
          <div />
        </div>
        <span className={base.srOnly}>Loading Publisher details…</span>
      </div>
    );
  }

  if (publisher.error) {
    return (
      <div className={base.detailPage}>
        <Link className={base.backLink} to={backTo}>
          <FiArrowLeft aria-hidden="true" /> Back to Publishers
        </Link>
        <div className={base.detailError} role="alert">
          <div className={base.stateIcon}>!</div>
          <h1>
            {publisher.error.status === 404
              ? "Publisher not found"
              : publisher.error.status === 403
                ? "Administrator permission required"
                : "Unable to load Publisher"}
          </h1>
          <p>{publisher.error.message}</p>
          {publisher.error.retryable ? (
            <button
              type="button"
              className={base.secondaryButton}
              onClick={publisher.refetch}
            >
              <FiRefreshCw aria-hidden="true" /> Try again
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const detail = publisher.data;
  const userUnavailable = detail.user.status !== "ACTIVE";

  return (
    <div className={base.detailPage}>
      <Link className={base.backLink} to={backTo}>
        <FiArrowLeft aria-hidden="true" /> Back to Publishers
      </Link>

      <header className={base.detailHero}>
        <div className={base.detailIdentity}>
          <PublisherAvatar publisher={detail} />
          <div>
            <span className={base.eyebrow}>Publisher record</span>
            <h1>{detail.profile?.fullName || detail.user.username}</h1>
            <p>
              @{detail.user.username}
              {detail.profile?.email ? ` · ${detail.profile.email}` : ""}
            </p>
            <div className={base.heroBadges}>
              <span
                className={`${styles.termsBadge} ${
                  detail.acceptedCurrentTerms
                    ? styles.termsCurrent
                    : styles.termsMissing
                }`}
              >
                {detail.acceptedCurrentTerms
                  ? "Current Terms accepted"
                  : "Current Terms missing"}
              </span>
            </div>
          </div>
        </div>
        <div className={base.detailActions}>
          <button
            type="button"
            className={base.secondaryButton}
            onClick={publisher.refetch}
            disabled={publisher.loading}
          >
            <FiRefreshCw aria-hidden="true" /> Refresh
          </button>
          <button
            type="button"
            className={detail.status === "ACTIVE" ? base.dangerButton : base.primaryButton}
            onClick={() => setDialogOpen(true)}
          >
            {detail.status === "ACTIVE" ? (
              <FiSlash aria-hidden="true" />
            ) : (
              <FiUserCheck aria-hidden="true" />
            )}
            {detail.status === "ACTIVE" ? "Block Publisher" : "Unblock Publisher"}
          </button>
        </div>
      </header>

      <div className={base.announcement} aria-live="polite">
        {announcement}
      </div>

      {userUnavailable ? (
        <div className={`${base.neutralNotice} ${styles.userWarning}`} role="note">
          <FiShield aria-hidden="true" />
          <span>
            The linked User is {detail.user.status.toLowerCase()}. Publisher status and
            User status are separate; effective Publisher access may remain unavailable.
          </span>
        </div>
      ) : null}

      <div className={`${base.detailGrid} ${styles.detailGrid}`}>
        <section className={base.detailCard}>
          <header>
            <FiShield aria-hidden="true" />
            <div><span className={base.eyebrow}>Moderation</span><h2>Publisher access</h2></div>
          </header>
          <dl className={base.detailList}>
            <DetailField label="Status"><PublisherStatusBadge status={detail.status} /></DetailField>
            <DetailField label="Activated">{formatDateTime(detail.activatedAt)}</DetailField>
            <DetailField label="Blocked at">{formatDateTime(detail.blockedAt)}</DetailField>
            <DetailField label="Blocked by">
              {detail.blockedById ? (
                <code title={detail.blockedById}>{detail.blockedById}</code>
              ) : "Not recorded"}
            </DetailField>
            <DetailField label="Blocked reason" wide>
              <span className={styles.longText}>{displayValue(detail.blockedReason)}</span>
            </DetailField>
          </dl>
        </section>

        <section className={base.detailCard}>
          <header>
            <FiUser aria-hidden="true" />
            <div><span className={base.eyebrow}>Linked identity</span><h2>User account</h2></div>
          </header>
          <dl className={base.detailList}>
            <DetailField label="Username">@{detail.user.username}</DetailField>
            <DetailField label="User status"><AdminUserStatusBadge status={detail.user.status} /></DetailField>
            <DetailField label="User ID" wide>
              <Link to={`/admin/users/${detail.user.id}`} state={{ from: location.pathname }}>
                {detail.user.id} <FiExternalLink aria-hidden="true" />
              </Link>
            </DetailField>
          </dl>
        </section>

        <section className={`${base.detailCard} ${styles.profileCard}`}>
          <header>
            <FiUser aria-hidden="true" />
            <div><span className={base.eyebrow}>Publisher identity</span><h2>Profile</h2></div>
          </header>
          {detail.profile ? (
            <dl className={base.detailList}>
              <DetailField label="Full name">{detail.profile.fullName}</DetailField>
              <DetailField label="Profile created">{formatDateTime(detail.profile.createdAt)}</DetailField>
              <DetailField label="Email">
                {detail.profile.email ? (
                  <a href={`mailto:${detail.profile.email}`}><FiMail aria-hidden="true" /> {detail.profile.email}</a>
                ) : "Not provided"}
              </DetailField>
              <DetailField label="Phone">
                {detail.profile.phone ? (
                  <a href={`tel:${detail.profile.phone}`}><FiPhone aria-hidden="true" /> {detail.profile.phone}</a>
                ) : "Not provided"}
              </DetailField>
              <DetailField label="Birthday">
                <FiCalendar aria-hidden="true" /> {detail.profile.birthday ? formatCommerceDate(detail.profile.birthday) : "Not provided"}
              </DetailField>
              <DetailField label="Gender">{displayValue(detail.profile.gender)}</DetailField>
              <DetailField label="Address" wide>
                <FiMapPin aria-hidden="true" /> {displayValue(detail.profile.address)}
              </DetailField>
              <DetailField label="Bio" wide>
                <span className={styles.longText}>{displayValue(detail.profile.bio)}</span>
              </DetailField>
              {safeLinks.length ? (
                <DetailField label="Links" wide>
                  <div className={base.externalLinks}>
                    {safeLinks.map((item) => (
                      <a key={item.label} href={item.href} target="_blank" rel="noreferrer noopener">
                        {item.label} <FiExternalLink aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </DetailField>
              ) : null}
            </dl>
          ) : (
            <div className={base.cardEmpty}>No profile is attached to this Publisher account.</div>
          )}
        </section>

        <section className={`${base.detailCard} ${base.auditCard}`}>
          <header>
            <FiFileText aria-hidden="true" />
            <div><span className={base.eyebrow}>Terms compliance</span><h2>Accepted Terms</h2></div>
            <span className={`${styles.complianceSummary} ${detail.acceptedCurrentTerms ? styles.compliant : styles.nonCompliant}`}>
              {detail.acceptedCurrentTerms ? "Current" : "Review required"}
            </span>
          </header>
          <AcceptedTerms terms={sortedTerms} />
        </section>
      </div>

      {dialogOpen ? (
        <PublisherStatusDialog
          publisher={detail}
          onClose={() => setDialogOpen(false)}
          onVerify={publisher.refetch}
          onSuccess={(nextStatus) => {
            setDialogOpen(false);
            setAnnouncement(
              nextStatus === "BLOCKED"
                ? "Publisher blocked. Publisher access and the active Publisher role were removed."
                : "Publisher unblocked. The Publisher role was restored; effective access still depends on the linked User and Terms state.",
            );
            publisher.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
