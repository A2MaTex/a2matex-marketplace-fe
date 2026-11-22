import { formatCommerceDate } from "@/features/commerce/model/date";
import { auditEntryMeta, formatAuditEvidence } from "../model/safeAuditEvidence";
import AdminEntitlementDialog from "./AdminEntitlementDialog";
import AdminEntitlementStatus from "./AdminEntitlementStatus";
import styles from "../EntitlementManagementPage.module.css";

const dateTime = (value) =>
  value ? formatCommerceDate(value, { withTime: true }) : "Not recorded";

export default function EntitlementDetailDrawer({ entitlement, onClose, onRevoke }) {
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
            <div><dt>Customer</dt><dd>{entitlement.customerId}</dd></div>
            <div><dt>Product</dt><dd>{entitlement.productId}</dd></div>
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

        <section className={styles.revokeMetadata}>
          <div className={styles.sectionHeading}>
            <span>Revocation metadata</span>
            {entitlement.status !== "REVOKED" ? (
              <button type="button" className={styles.dangerButton} onClick={onRevoke}>Revoke access</button>
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
                const meta = auditEntryMeta(entry, index);
                return (
                  <li key={`${entitlement.id}-audit-${index}`}>
                    <div className={styles.timelineDot} aria-hidden="true" />
                    <div className={styles.timelineCard}>
                      <header>
                        <strong>{String(meta.title)}</strong>
                        <time>{meta.timestamp ? dateTime(meta.timestamp) : "Time unavailable"}</time>
                      </header>
                      {meta.actor ? <p>Actor · <code>{String(meta.actor)}</code></p> : null}
                      <div className={styles.evidenceGrid}>
                        {meta.before !== null ? (
                          <div><span>Before</span><pre>{formatAuditEvidence(meta.before)}</pre></div>
                        ) : null}
                        {meta.after !== null ? (
                          <div><span>After</span><pre>{formatAuditEvidence(meta.after)}</pre></div>
                        ) : null}
                        {meta.before === null && meta.after === null ? (
                          <div><span>Evidence</span><pre>{formatAuditEvidence(meta.raw)}</pre></div>
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
