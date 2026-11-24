import { formatCommerceDate } from "@/features/commerce/model/date";
import { auditEntryMeta, formatAuditEvidence } from "../model/safeAuditEvidence";
import AdminEntitlementDialog from "./AdminEntitlementDialog";
import AdminEntitlementStatus from "./AdminEntitlementStatus";
import base from "../../user-manage/page/UserManage.module.css";
import styles from "../EntitlementManagementPage.module.css";

const dateTime = (value) =>
  value ? formatCommerceDate(value, { withTime: true }) : "Not recorded";

const referenceName = (reference, kind) => {
  if (reference?.status === "loading") return `Loading ${kind}…`;
  return reference?.name || `${kind} unavailable`;
};

function ReferenceDetail({ reference, kind, id }) {
  return (
    <dd className={styles.namedReference}>
      <strong>{referenceName(reference, kind)}</strong>
      {reference?.secondary ? <span>{reference.secondary}</span> : null}
      <code>{id}</code>
    </dd>
  );
}

export default function EntitlementDetailDrawer({
  entitlement,
  customerReference,
  productReference,
  onClose,
  onRevoke,
}) {
  return (
    <AdminEntitlementDialog
      title="Entitlement record"
      description="Authoritative server state and append-only audit evidence."
      onClose={onClose}
      wide
    >
      <div className={styles.drawerBody}>
        <section className={styles.recordHero}>
          <div>
            <span className={styles.monoLabel}>ENTITLEMENT ID</span>
            <strong>{entitlement.id}</strong>
          </div>
          <AdminEntitlementStatus status={entitlement.status} />
        </section>

        <section className={styles.statusExplanation}>
          <div>
            <span>Display status</span>
            <AdminEntitlementStatus status={entitlement.status} />
            <p>Computed and returned by the server for display and access decisions.</p>
          </div>
          <div>
            <span>Stored status</span>
            <AdminEntitlementStatus
              status={entitlement.storedStatus}
              label={`${entitlement.storedStatus} · stored`}
            />
            <p>Persisted database value. It may differ when expiry is computed at read time.</p>
          </div>
        </section>

        <section className={styles.detailGrid}>
          <dl>
            <div>
              <dt>Customer</dt>
              <ReferenceDetail
                reference={customerReference}
                kind="Customer"
                id={entitlement.customerId}
              />
            </div>
            <div>
              <dt>Product</dt>
              <ReferenceDetail
                reference={productReference}
                kind="Product"
                id={entitlement.productId}
              />
            </div>
            <div><dt>Grant source</dt><dd>{entitlement.grantSource}</dd></div>
            <div><dt>Granted by</dt><dd>{entitlement.grantedById ?? "Order transaction"}</dd></div>
          </dl>
          <dl>
            <div><dt>Starts</dt><dd>{dateTime(entitlement.startsAt)}</dd></div>
            <div><dt>Expires</dt><dd>{entitlement.expiresAt ? dateTime(entitlement.expiresAt) : "Lifetime"}</dd></div>
            <div><dt>Created</dt><dd>{dateTime(entitlement.createdAt)}</dd></div>
            <div><dt>Updated</dt><dd>{dateTime(entitlement.updatedAt)}</dd></div>
          </dl>
        </section>

        <section className={styles.commerceEvidence}>
          <div className={styles.sectionHeading}>
            <span>Commerce evidence</span>
            <small>Read-only links retained across Admin resets</small>
          </div>
          <dl>
            <div><dt>Latest Product Offer</dt><dd>{entitlement.latestProductOfferId ?? "Not recorded"}</dd></div>
            <div><dt>Latest Order</dt><dd>{entitlement.latestOrderId ?? "Not recorded"}</dd></div>
            <div><dt>One-time purchased</dt><dd>{dateTime(entitlement.oneTimePurchasedAt)}</dd></div>
          </dl>
        </section>

        <section className={styles.revokeMetadata}>
          <div className={styles.sectionHeading}>
            <span>Revocation metadata</span>
            {entitlement.storedStatus !== "REVOKED" ? (
              <button type="button" className={base.dangerButton} onClick={onRevoke}>Revoke access</button>
            ) : null}
          </div>
          {entitlement.revokedAt ? (
            <dl>
              <div><dt>Revoked at</dt><dd>{dateTime(entitlement.revokedAt)}</dd></div>
              <div><dt>Actor</dt><dd>{entitlement.revokedById ?? "Unavailable"}</dd></div>
              <div><dt>Reason</dt><dd>{entitlement.revokedReason ?? "Unavailable"}</dd></div>
            </dl>
          ) : (
            <p>No revocation metadata is present on the server record.</p>
          )}
        </section>

        <section className={styles.auditSection}>
          <div className={styles.sectionHeading}>
            <span>Audit timeline</span>
            <small>{entitlement.auditHistory.length} immutable events</small>
          </div>
          {entitlement.auditHistory.length === 0 ? (
            <p className={styles.muted}>No audit events were returned.</p>
          ) : (
            <ol className={styles.timeline}>
              {entitlement.auditHistory.map((entry, index) => {
                const meta = auditEntryMeta(entry);
                return (
                  <li key={`${entry.actedAt}-${entry.action}-${index}`}>
                    <div className={styles.timelineDot} aria-hidden="true" />
                    <div className={styles.timelineCard}>
                      <header>
                        <strong>{String(meta.title)}</strong>
                        <time dateTime={meta.timestamp}>{dateTime(meta.timestamp)}</time>
                      </header>
                      <p className={styles.auditReason}>{meta.reason}</p>
                      <p>Actor · <code>{meta.actor}</code></p>
                      <div className={styles.evidenceGrid}>
                        {meta.before !== null ? (
                          <div><span>Before</span><pre>{formatAuditEvidence(meta.before)}</pre></div>
                        ) : null}
                        {meta.after !== null ? (
                          <div><span>After</span><pre>{formatAuditEvidence(meta.after)}</pre></div>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </AdminEntitlementDialog>
  );
}
