import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiExternalLink,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiUser,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";
import { formatCommerceDate } from "@/features/commerce/model/date";
import { safeExternalUrl } from "@/features/marketplace/utils/marketplaceLinks";
import { buildMarketplaceImageUrl } from "@/features/marketplace/utils/marketplaceMedia";
import { useAdminUserDetail } from "../hooks/useAdminUserDetail";
import { isProtectedAdmin } from "../model/adminUserModel";
import AdminUserStatusBadge from "../components/AdminUserStatusBadge";
import UserStatusDialog from "../components/UserStatusDialog";
import styles from "./UserManage.module.css";

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

const initials = (detail) => {
  const source = detail.profile?.fullName || detail.identity.username || "U";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

function DetailField({ label, children, wide = false }) {
  return (
    <div className={wide ? styles.detailFieldWide : styles.detailField}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function UserAvatar({ detail }) {
  const [failed, setFailed] = useState(false);
  const staticId = detail.profile?.avatarStaticId;
  if (!staticId || failed) {
    return <div className={styles.detailAvatarFallback}>{initials(detail)}</div>;
  }
  return (
    <img
      className={styles.detailAvatar}
      src={buildMarketplaceImageUrl(staticId, "small")}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}

function AuditHistory({ entries }) {
  if (entries.length === 0) {
    return (
      <div className={styles.auditEmpty}>
        No user status events have been recorded.
      </div>
    );
  }

  return (
    <ol className={styles.auditList}>
      {[...entries].reverse().map((entry, index) => {
        const event =
          entry && typeof entry === "object" && !Array.isArray(entry)
            ? entry
            : {};
        const status = typeof event.status === "string" ? event.status : null;
        const reason = typeof event.reason === "string" ? event.reason : null;
        const updatedAt =
          typeof event.updatedAt === "string" ? event.updatedAt : null;
        const updatedById =
          typeof event.updatedById === "string" ? event.updatedById : null;
        return (
          <li key={`${updatedAt ?? "event"}-${index}`}>
            <span className={styles.auditMarker} aria-hidden="true" />
            <div className={styles.auditContent}>
              <div className={styles.auditTitle}>
                <strong>
                  {status === "BANNED"
                    ? "User banned"
                    : status === "ACTIVE"
                      ? "User unbanned"
                      : "User status event"}
                </strong>
                <time dateTime={updatedAt ?? undefined}>
                  {formatDateTime(updatedAt)}
                </time>
              </div>
              <p>{reason || "No reason was supplied in this audit entry."}</p>
              {updatedById ? <small>Changed by {updatedById}</small> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function UserDetail() {
  const { userId } = useParams();
  const location = useLocation();
  const user = useAdminUserDetail(userId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const backTo =
    typeof location.state?.from === "string" &&
    location.state.from.startsWith("/admin/users")
      ? location.state.from
      : "/admin/users";

  const safeLinks = useMemo(
    () =>
      user.data?.profile
        ? profileLinks
            .map(([label, key]) => ({
              label,
              href: safeExternalUrl(user.data.profile[key]),
            }))
            .filter((item) => item.href)
        : [],
    [user.data],
  );

  if (user.loading && !user.data) {
    return (
      <div className={styles.detailPage} aria-busy="true">
        <div className={styles.detailSkeletonHeader} />
        <div className={styles.detailSkeletonGrid}>
          <div />
          <div />
          <div />
        </div>
        <span className={styles.srOnly}>Loading user details…</span>
      </div>
    );
  }

  if (user.error) {
    return (
      <div className={styles.detailPage}>
        <Link className={styles.backLink} to={backTo}>
          <FiArrowLeft aria-hidden="true" /> Back to users
        </Link>
        <div className={styles.detailError} role="alert">
          <div className={styles.stateIcon}>!</div>
          <h1>
            {user.error.status === 404
              ? "User not found"
              : user.error.status === 403
                ? "Administrator permission required"
                : "Unable to load user"}
          </h1>
          <p>{user.error.message}</p>
          {user.error.retryable ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={user.refetch}
            >
              <FiRefreshCw aria-hidden="true" /> Try again
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const detail = user.data;
  const protectedAdmin = isProtectedAdmin(detail.roles);
  const canChangeStatus =
    !protectedAdmin && ["ACTIVE", "BANNED"].includes(detail.identity.status);

  return (
    <div className={styles.detailPage}>
      <Link className={styles.backLink} to={backTo}>
        <FiArrowLeft aria-hidden="true" /> Back to users
      </Link>

      <header className={styles.detailHero}>
        <div className={styles.detailIdentity}>
          <UserAvatar detail={detail} />
          <div>
            <span className={styles.eyebrow}>User record</span>
            <h1>{detail.profile?.fullName || detail.identity.username}</h1>
            <p>@{detail.identity.username} · {detail.identity.email}</p>
            <div className={styles.heroBadges}>
              <div className={styles.details}>
                {detail.roles.map((role) => (
                  <span className={styles.roleBadge} key={role.id}>
                    {role.name}
                  </span>
                ))}
              </div>
              <AdminUserStatusBadge status={detail.identity.status} />
            </div>
          </div>
        </div>
        <div className={styles.detailActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={user.refetch}
          >
            <FiRefreshCw aria-hidden="true" /> Refresh
          </button>
          {canChangeStatus ? (
            <button
              type="button"
              className={
                detail.identity.status === "ACTIVE"
                  ? styles.dangerButton
                  : styles.primaryButton
              }
              onClick={() => setDialogOpen(true)}
            >
              {detail.identity.status === "ACTIVE" ? (
                <FiUserX aria-hidden="true" />
              ) : (
                <FiUserCheck aria-hidden="true" />
              )}
              {detail.identity.status === "ACTIVE" ? "Ban user" : "Unban user"}
            </button>
          ) : null}
        </div>
      </header>

      <div className={styles.announcement} aria-live="polite">
        {announcement}
      </div>

      {protectedAdmin ? (
        <div className={styles.protectedNotice} role="note">
          <FiShield aria-hidden="true" />
          <div>
            <strong>Protected administrator</strong>
            <span>Admin accounts cannot be banned or unbanned through this workflow.</span>
          </div>
        </div>
      ) : detail.identity.status === "INACTIVE" ? (
        <div className={styles.neutralNotice} role="note">
          This account is inactive. The current API does not support activating it.
        </div>
      ) : null}

      <div className={styles.detailGrid}>
        <section className={styles.detailCard}>
          <header>
            <FiUser aria-hidden="true" />
            <div><span className={styles.eyebrow}>Account</span><h2>Identity</h2></div>
          </header>
          <dl className={styles.detailList}>
            <DetailField label="Username">@{detail.identity.username}</DetailField>
            <DetailField label="Email">
              <a href={`mailto:${detail.identity.email}`}>{detail.identity.email}</a>
            </DetailField>
            <DetailField label="Created">{formatDateTime(detail.identity.createdAt)}</DetailField>
            <DetailField label="Last updated">{formatDateTime(detail.identity.updatedAt)}</DetailField>
          </dl>
        </section>

        <section className={styles.detailCard}>
          <header>
            <FiUser aria-hidden="true" />
            <div><span className={styles.eyebrow}>Personal data</span><h2>Profile</h2></div>
          </header>
          {detail.profile ? (
            <dl className={styles.detailList}>
              <DetailField label="Full name">{displayValue(detail.profile.fullName)}</DetailField>
              <DetailField label="Profile email">
                {detail.profile.email ? <a href={`mailto:${detail.profile.email}`}><FiMail aria-hidden="true" /> {detail.profile.email}</a> : "Not provided"}
              </DetailField>
              <DetailField label="Phone">
                {detail.profile.phone ? <a href={`tel:${detail.profile.phone}`}><FiPhone aria-hidden="true" /> {detail.profile.phone}</a> : "Not provided"}
              </DetailField>
              <DetailField label="Birthday"><FiCalendar aria-hidden="true" /> {detail.profile.birthday ? formatCommerceDate(detail.profile.birthday) : "Not provided"}</DetailField>
              <DetailField label="Gender">{displayValue(detail.profile.gender)}</DetailField>
              <DetailField label="Address" wide><FiMapPin aria-hidden="true" /> {displayValue(detail.profile.address)}</DetailField>
              <DetailField label="Bio" wide>{displayValue(detail.profile.bio)}</DetailField>
              {safeLinks.length ? (
                <DetailField label="Links" wide>
                  <div className={styles.externalLinks}>
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
            <div className={styles.cardEmpty}>No profile is attached to this account.</div>
          )}
        </section>

        <section className={styles.detailCard}>
          <header>
            <FiShield aria-hidden="true" />
            <div><span className={styles.eyebrow}>Publisher access</span><h2>Publisher account</h2></div>
          </header>
          {detail.publisher ? (
            <dl className={styles.detailList}>
              <DetailField label="Status"><span className={styles.publisherStatus}>{detail.publisher.status}</span></DetailField>
              <DetailField label="Activated">{formatDateTime(detail.publisher.activatedAt)}</DetailField>
              <DetailField label="Blocked at">{formatDateTime(detail.publisher.blockedAt)}</DetailField>
              <DetailField label="Blocked reason" wide>{displayValue(detail.publisher.blockedReason)}</DetailField>
            </dl>
          ) : (
            <div className={styles.cardEmpty}>This user does not have a Publisher account.</div>
          )}
        </section>

        <section className={`${styles.detailCard} ${styles.auditCard}`}>
          <header>
            <FiCalendar aria-hidden="true" />
            <div><span className={styles.eyebrow}>Record-local history</span><h2>Audit history</h2></div>
          </header>
          <AuditHistory entries={detail.auditHistory} />
        </section>

        <section className={`${styles.detailCard} ${styles.entitlementCard}`}>
          <header>
            <FiShield aria-hidden="true" />
            <div><span className={styles.eyebrow}>Product access</span><h2>Entitlements</h2></div>
          </header>
          {detail.entitlements === null ? (
            <div className={styles.cardEmpty}>
              Entitlement totals are not available in this response. Use the Entitlements feature after its runtime permission is deployed.
            </div>
          ) : (
            <dl className={styles.entitlementSummary}>
              {Object.entries(detail.entitlements).map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{String(value)}</dd></div>
              ))}
            </dl>
          )}
        </section>
      </div>

      {dialogOpen ? (
        <UserStatusDialog
          user={detail}
          onClose={() => setDialogOpen(false)}
          onConflict={user.refetch}
          onSuccess={(nextStatus) => {
            setDialogOpen(false);
            setAnnouncement(
              nextStatus === "BANNED"
                ? "User banned. Active sessions and devices were revoked."
                : "User unbanned. They must sign in again to create a new session.",
            );
            user.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
