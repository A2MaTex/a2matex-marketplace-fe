import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MdAdd,
  MdChevronLeft,
  MdChevronRight,
  MdFilterAlt,
  MdOutlineKey,
  MdRefresh,
  MdSearch,
} from "react-icons/md";
import { isCommerceUuid } from "@/features/commerce/model/commerceContract";
import { formatCommerceDate } from "@/features/commerce/model/date";
import { buildAdminEntitlementQuery } from "./model/adminEntitlementRequest";
import { useAdminEntitlements } from "./hooks/useAdminEntitlements";
import AdminEntitlementStatus from "./components/AdminEntitlementStatus";
import EntitlementDetailDrawer from "./components/EntitlementDetailDrawer";
import GrantEntitlementDialog from "./components/GrantEntitlementDialog";
import RevokeEntitlementDialog from "./components/RevokeEntitlementDialog";
import styles from "./EntitlementManagementPage.module.css";

const PAGE_SIZE = 20;
const positivePage = (value) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const shortId = (value) => `${value.slice(0, 8)}…${value.slice(-6)}`;

export default function EntitlementManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positivePage(searchParams.get("page"));
  const customerId = searchParams.get("customerId") ?? "";
  const productId = searchParams.get("productId") ?? "";
  const [filters, setFilters] = useState({ customerId, productId });
  const [filterError, setFilterError] = useState("");
  const [selected, setSelected] = useState(null);
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [announcement, setAnnouncement] = useState("");

  const validFilters =
    (!customerId || isCommerceUuid(customerId)) &&
    (!productId || isCommerceUuid(productId));
  const query = useMemo(
    () =>
      buildAdminEntitlementQuery({
        page,
        limit: PAGE_SIZE,
        customerId: validFilters ? customerId : undefined,
        productId: validFilters ? productId : undefined,
      }),
    [customerId, page, productId, validFilters],
  );
  const entitlements = useAdminEntitlements({ query, enabled: validFilters });

  useEffect(() => {
    if (
      !entitlements.loading &&
      !entitlements.error &&
      page > 1 &&
      (entitlements.data.totalPages === 0 || page > entitlements.data.totalPages)
    ) {
      const next = new URLSearchParams(searchParams);
      next.delete("page");
      setSearchParams(next, { replace: true });
    }
  }, [entitlements.data.totalPages, entitlements.error, entitlements.loading, page, searchParams, setSearchParams]);

  const applyFilters = (event) => {
    event.preventDefault();
    const nextCustomerId = filters.customerId.trim();
    const nextProductId = filters.productId.trim();
    if (nextCustomerId && !isCommerceUuid(nextCustomerId)) {
      setFilterError("Customer filter must be a valid UUID.");
      return;
    }
    if (nextProductId && !isCommerceUuid(nextProductId)) {
      setFilterError("Product filter must be a valid UUID.");
      return;
    }
    const next = new URLSearchParams();
    if (nextCustomerId) next.set("customerId", nextCustomerId);
    if (nextProductId) next.set("productId", nextProductId);
    setFilterError("");
    setSearchParams(next);
  };

  const changePage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage > 1) next.set("page", String(nextPage));
    else next.delete("page");
    setSearchParams(next);
  };

  const authoritativeRefresh = (message) => {
    entitlements.refetch();
    setAnnouncement(message);
  };

  const mutationSucceeded = (message) => {
    setGrantOpen(false);
    setRevokeTarget(null);
    setSelected(null);
    authoritativeRefresh(message);
  };

  return (
    <main className={styles.page}>
      <div className={styles.liveRegion} aria-live="polite" aria-atomic="true">{announcement}</div>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Access control · Server authoritative</span>
          <h1>Entitlement management</h1>
          <p>Inspect current access, reset grants and record revocations without calculating status or dates in the browser.</p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={() => setGrantOpen(true)}>
          <MdAdd aria-hidden="true" /> Grant access
        </button>
      </header>

      <section className={styles.filterPanel} aria-labelledby="entitlement-filters-title">
        <div className={styles.filterHeading}>
          <MdFilterAlt aria-hidden="true" />
          <div><h2 id="entitlement-filters-title">Exact UUID filters</h2><p>Empty values are omitted from the API request.</p></div>
        </div>
        <form className={styles.filters} onSubmit={applyFilters} noValidate>
          <label><span>Customer UUID</span><input value={filters.customerId} onChange={(event) => { setFilters((current) => ({ ...current, customerId: event.target.value })); setFilterError(""); }} placeholder="Filter by customer" /></label>
          <label><span>Product UUID</span><input value={filters.productId} onChange={(event) => { setFilters((current) => ({ ...current, productId: event.target.value })); setFilterError(""); }} placeholder="Filter by product" /></label>
          <button type="submit" className={styles.filterButton}><MdSearch aria-hidden="true" /> Apply</button>
          <button type="button" className={styles.clearButton} onClick={() => { setFilters({ customerId: "", productId: "" }); setFilterError(""); setSearchParams(new URLSearchParams()); }}>Clear</button>
        </form>
        {filterError || !validFilters ? <p className={styles.inlineError} role="alert">{filterError || "The URL contains an invalid UUID filter."}</p> : null}
      </section>

      <section className={styles.dataPanel} aria-label="Entitlement records" aria-busy={entitlements.loading}>
        <div className={styles.dataHeader}>
          <div>
            <span>Access registry</span>
            {!entitlements.loading && !entitlements.error ? <strong>{entitlements.data.totalItems} records</strong> : null}
          </div>
          <button type="button" className={styles.iconButton} onClick={entitlements.refetch} disabled={entitlements.loading} aria-label="Refresh entitlements"><MdRefresh aria-hidden="true" /></button>
        </div>

        {entitlements.loading ? (
          <div className={styles.state} aria-live="polite"><span className={styles.loader} /><p>Loading authoritative entitlement records…</p></div>
        ) : null}
        {!entitlements.loading && entitlements.error ? (
          <div className={styles.state} role="alert"><MdOutlineKey aria-hidden="true" /><h2>Records unavailable</h2><p>{entitlements.error.message}</p><button type="button" className={styles.secondaryButton} onClick={entitlements.refetch}>Retry</button></div>
        ) : null}
        {!entitlements.loading && !entitlements.error && entitlements.data.items.length === 0 ? (
          <div className={styles.state}><MdOutlineKey aria-hidden="true" /><h2>No matching entitlements</h2><p>Change the UUID filters or grant access to create a record.</p></div>
        ) : null}

        {!entitlements.loading && !entitlements.error && entitlements.data.items.length > 0 ? (
          <div className={styles.tableScroller}>
            <table>
              <thead><tr><th>Entitlement</th><th>Customer / Product</th><th>Display status</th><th>Stored status</th><th>Period</th><th><span className={styles.srOnly}>Actions</span></th></tr></thead>
              <tbody>
                {entitlements.data.items.map((item) => (
                  <tr key={item.id}>
                    <td><button type="button" className={styles.recordLink} onClick={() => setSelected(item)}><strong>{shortId(item.id)}</strong><span>{item.grantSource === "ORDER" ? "Order purchase" : "Admin grant"}</span></button></td>
                    <td><span className={styles.idLine}>C · {shortId(item.customerId)}</span><span className={styles.idLine}>P · {shortId(item.productId)}</span></td>
                    <td><AdminEntitlementStatus status={item.status} /></td>
                    <td><AdminEntitlementStatus status={item.storedStatus} label={`${item.storedStatus} · stored`} /></td>
                    <td><strong className={styles.period}>{item.expiresAt ? formatCommerceDate(item.expiresAt, { withTime: true }) : "Lifetime"}</strong><span className={styles.periodSub}>from {formatCommerceDate(item.startsAt)}</span></td>
                    <td><button type="button" className={styles.viewButton} onClick={() => setSelected(item)}>Inspect</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!entitlements.loading && !entitlements.error && entitlements.data.totalPages > 1 ? (
          <nav className={styles.pagination} aria-label="Entitlement pages">
            <button type="button" onClick={() => changePage(page - 1)} disabled={page <= 1}><MdChevronLeft aria-hidden="true" /><span className={styles.srOnly}>Previous page</span></button>
            <span>Page <strong>{entitlements.data.page}</strong> of <strong>{entitlements.data.totalPages}</strong></span>
            <button type="button" onClick={() => changePage(page + 1)} disabled={page >= entitlements.data.totalPages}><MdChevronRight aria-hidden="true" /><span className={styles.srOnly}>Next page</span></button>
          </nav>
        ) : null}
      </section>

      {grantOpen ? <GrantEntitlementDialog defaults={{ customerId, productId }} onClose={() => setGrantOpen(false)} onSuccess={() => mutationSucceeded("Entitlement grant applied. Records refreshed from the server.")} /> : null}
      {selected ? <EntitlementDetailDrawer entitlement={selected} onClose={() => setSelected(null)} onRevoke={() => { setRevokeTarget(selected); setSelected(null); }} /> : null}
      {revokeTarget ? <RevokeEntitlementDialog entitlement={revokeTarget} onClose={() => setRevokeTarget(null)} onSuccess={() => mutationSucceeded("Entitlement revoked. Records refreshed from the server.")} onConflict={() => authoritativeRefresh("The entitlement was already revoked. Records refreshed from the server.")} /> : null}
    </main>
  );
}
