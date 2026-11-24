import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MdAdd,
  MdChevronLeft,
  MdChevronRight,
  MdOutlineKey,
  MdRefresh,
} from "react-icons/md";
import { isCommerceUuid } from "@/features/commerce/model/commerceContract";
import { formatCommerceDate } from "@/features/commerce/model/date";
import { buildAdminEntitlementQuery } from "./model/adminEntitlementRequest";
import { useAdminEntitlements } from "./hooks/useAdminEntitlements";
import { useAdminEntitlementReferences } from "./hooks/useAdminEntitlementReferences";
import AdminEntitlementStatus from "./components/AdminEntitlementStatus";
import EntitlementDetailDrawer from "./components/EntitlementDetailDrawer";
import GrantEntitlementDialog from "./components/GrantEntitlementDialog";
import RevokeEntitlementDialog from "./components/RevokeEntitlementDialog";
import base from "../user-manage/page/UserManage.module.css";
import styles from "./EntitlementManagementPage.module.css";

const PAGE_SIZE = 20;
const positivePage = (value) => {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
};

const shortId = (value) => `${value.slice(0, 8)}…${value.slice(-6)}`;
const formatDate = (value, withTime = false) =>
  value ? formatCommerceDate(value, { withTime }) : "Not recorded";

const referenceName = (reference, kind) => {
  if (reference?.status === "loading") return `Loading ${kind}…`;
  return reference?.name || `${kind} unavailable`;
};

function ReferenceIdentity({ kind, reference }) {
  return (
    <div className={styles.referenceIdentity}>
      <strong>{referenceName(reference, kind)}</strong>
      {reference?.secondary ? <small>{reference.secondary}</small> : null}
    </div>
  );
}

export default function EntitlementManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const page = positivePage(searchParams.get("page"));
  const customerId = searchParams.get("customerId") ?? "";
  const productId = searchParams.get("productId") ?? "";
  const [filters, setFilters] = useState({ customerId, productId });
  const [filterError, setFilterError] = useState("");
  const [selected, setSelected] = useState(null);
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    queueMicrotask(() => setFilters({ customerId, productId }));
  }, [customerId, productId]);

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
  const references = useAdminEntitlementReferences(entitlements.data.items);

  useEffect(() => {
    if (
      entitlements.loading ||
      entitlements.error ||
      page <= 1 ||
      (entitlements.data.totalPages > 0 && page <= entitlements.data.totalPages)
    ) {
      return;
    }
    const next = new URLSearchParams(searchKey);
    const lastPage = Math.max(entitlements.data.totalPages, 1);
    if (lastPage > 1) next.set("page", String(lastPage));
    else next.delete("page");
    setSearchParams(next, { replace: true });
  }, [
    entitlements.data.totalPages,
    entitlements.error,
    entitlements.loading,
    page,
    searchKey,
    setSearchParams,
  ]);

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

  const clearFilters = () => {
    setFilters({ customerId: "", productId: "" });
    setFilterError("");
    setSearchParams(new URLSearchParams());
  };

  const changePage = (nextPage) => {
    const next = new URLSearchParams(searchKey);
    if (nextPage > 1) next.set("page", String(nextPage));
    else next.delete("page");
    setSearchParams(next);
  };

  const authoritativeRefresh = (message) => {
    entitlements.refetch();
    references.refetch();
    setAnnouncement(message);
  };

  const refreshAll = () => {
    entitlements.refetch();
    references.refetch();
  };

  const mutationSucceeded = (message) => {
    setGrantOpen(false);
    setRevokeTarget(null);
    setSelected(null);
    authoritativeRefresh(message);
  };

  const hasFilters = Boolean(customerId || productId);
  const firstResult = entitlements.data.totalItems
    ? (entitlements.data.page - 1) * entitlements.data.pageSize + 1
    : 0;
  const lastResult = Math.min(
    entitlements.data.page * entitlements.data.pageSize,
    entitlements.data.totalItems,
  );

  return (
    <div className={base.page}>
      <div className={base.announcement} aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <header className={base.pageHeader}>
        <div>
          <span className={base.eyebrow}>Commerce &amp; access</span>
          <h1>Entitlement Management</h1>
          <p>
            Inspect server-authoritative access, grant or reset periods, and
            record immediate revocations.
          </p>
        </div>
        <div className={`${base.headerActions} ${styles.headerActions}`}>
          <span className={base.totalBadge}>
            <MdOutlineKey aria-hidden="true" />
            {entitlements.loading
              ? "Loading"
              : `${entitlements.data.totalItems} Entitlements`}
          </span>
          <button
            type="button"
            className={base.secondaryButton}
            onClick={refreshAll}
            disabled={entitlements.loading || !validFilters}
          >
            <MdRefresh aria-hidden="true" /> Refresh
          </button>
          <button
            type="button"
            className={base.primaryButton}
            onClick={() => setGrantOpen(true)}
          >
            <MdAdd aria-hidden="true" /> Grant access
          </button>
        </div>
      </header>

      <form className={base.filters} onSubmit={applyFilters} noValidate>
        <div className={base.filterHeading}>
          <div><span>Exact UUID filters</span></div>
          {hasFilters ? (
            <button type="button" onClick={clearFilters}>Clear all</button>
          ) : null}
        </div>
        <div className={`${base.filterGrid} ${styles.filterGrid}`}>
          <label className={base.field}>
            <span>Customer UUID</span>
            <input
              value={filters.customerId}
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  customerId: event.target.value,
                }));
                setFilterError("");
              }}
              placeholder="Filter by exact Customer UUID"
              aria-invalid={Boolean(filterError?.startsWith("Customer"))}
            />
          </label>
          <label className={base.field}>
            <span>Product UUID</span>
            <input
              value={filters.productId}
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  productId: event.target.value,
                }));
                setFilterError("");
              }}
              placeholder="Filter by exact Product UUID"
              aria-invalid={Boolean(filterError?.startsWith("Product"))}
            />
          </label>
          <button type="submit" className={base.primaryButton}>
            Apply filters
          </button>
        </div>
        {filterError || !validFilters ? (
          <p className={base.formError} role="alert">
            {filterError || "The URL contains an invalid UUID filter."}
          </p>
        ) : null}
      </form>

      <section className={base.directory} aria-live="polite">
        <div className={base.directoryHeader}>
          <div>
            <span className={base.eyebrow}>Access registry</span>
            <h2>{hasFilters ? "Filtered Entitlements" : "All Entitlements"}</h2>
          </div>
          {!entitlements.loading && !entitlements.error && validFilters ? (
            <span>{firstResult}–{lastResult} of {entitlements.data.totalItems}</span>
          ) : null}
        </div>

        {entitlements.loading ? (
          <div className={base.loadingState} aria-busy="true">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={base.skeletonRow} />
            ))}
            <span className={base.srOnly}>Loading entitlement records…</span>
          </div>
        ) : entitlements.error ? (
          <div className={base.statePanel} role="alert">
            <div className={base.stateIcon}>!</div>
            <h3>
              {entitlements.error.status === 403
                ? "Administrator permission required"
                : "Unable to load Entitlements"}
            </h3>
            <p>{entitlements.error.message}</p>
            {entitlements.error.retryable ? (
              <button
                type="button"
                className={base.secondaryButton}
                onClick={entitlements.refetch}
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : !validFilters ? (
          <div className={base.statePanel}>
            <div className={base.stateIcon}>!</div>
            <h3>Invalid URL filters</h3>
            <p>Clear the filters or enter valid UUID values before loading data.</p>
            <button type="button" className={base.secondaryButton} onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : entitlements.data.items.length === 0 ? (
          <div className={base.statePanel}>
            <div className={base.emptyIcon}>
              <MdOutlineKey aria-hidden="true" />
            </div>
            <h3>No matching Entitlements</h3>
            <p>Change the exact UUID filters or grant access to create a record.</p>
            {hasFilters ? (
              <button type="button" className={base.secondaryButton} onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className={`${base.tableWrap} ${styles.desktopTable}`}>
              <table className={`${base.table} ${styles.entitlementTable}`}>
                <thead>
                  <tr>
                    <th>Entitlement</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Effective status</th>
                    <th>Stored status</th>
                    <th>Access period</th>
                    <th><span className={base.srOnly}>Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {entitlements.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <button
                          type="button"
                          className={styles.recordLink}
                          onClick={() => setSelected(item)}
                        >
                          <strong>{shortId(item.id)}</strong>
                          <span>{item.grantSource === "ORDER" ? "Order purchase" : "Admin grant"}</span>
                        </button>
                      </td>
                      <td>
                        <div className={styles.referenceStack}>
                          <ReferenceIdentity
                            kind="Customer"
                            reference={references.customers[item.customerId]}
                          />
                        </div>
                      </td>
                      <td>
                        <div className={styles.referenceStack}>
                          <ReferenceIdentity
                            kind="Product"
                            reference={references.products[item.productId]}
                          />
                        </div>
                      </td>
                      <td><AdminEntitlementStatus status={item.status} /></td>
                      <td>
                        <AdminEntitlementStatus
                          status={item.storedStatus}
                          label={`${item.storedStatus} · stored`}
                        />
                      </td>
                      <td>
                        <strong className={styles.period}>
                          {item.expiresAt
                            ? formatDate(item.expiresAt, true)
                            : "Lifetime"}
                        </strong>
                        <span className={styles.periodSub}>
                          from {formatDate(item.startsAt)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.inspectButton}
                          onClick={() => setSelected(item)}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileRecords}>
              {entitlements.data.items.map((item) => (
                <article className={styles.mobileRecord} key={`mobile-${item.id}`}>
                  <header>
                    <div>
                      <span className={base.eyebrow}>Entitlement</span>
                      <strong>{shortId(item.id)}</strong>
                    </div>
                    <AdminEntitlementStatus status={item.status} />
                  </header>
                  <dl>
                    <div>
                      <dt>Customer</dt>
                      <dd title={item.customerId}>
                        {referenceName(references.customers[item.customerId], "Customer")}
                        <small>{shortId(item.customerId)}</small>
                      </dd>
                    </div>
                    <div>
                      <dt>Product</dt>
                      <dd title={item.productId}>
                        {referenceName(references.products[item.productId], "Product")}
                        <small>{shortId(item.productId)}</small>
                      </dd>
                    </div>
                    <div><dt>Stored</dt><dd>{item.storedStatus}</dd></div>
                    <div><dt>Expires</dt><dd>{item.expiresAt ? formatDate(item.expiresAt) : "Lifetime"}</dd></div>
                  </dl>
                  <button
                    type="button"
                    className={base.secondaryButton}
                    onClick={() => setSelected(item)}
                  >
                    Inspect record
                  </button>
                </article>
              ))}
            </div>
          </>
        )}

        {!entitlements.loading &&
        !entitlements.error &&
        validFilters &&
        entitlements.data.totalPages > 1 ? (
          <footer className={base.pagination}>
            <span>Page {entitlements.data.page} of {entitlements.data.totalPages}</span>
            <div>
              <button
                type="button"
                onClick={() => changePage(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <MdChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => changePage(page + 1)}
                disabled={page >= entitlements.data.totalPages}
                aria-label="Next page"
              >
                <MdChevronRight aria-hidden="true" />
              </button>
            </div>
          </footer>
        ) : null}
      </section>

      {grantOpen ? (
        <GrantEntitlementDialog
          defaults={{ customerId, productId }}
          onClose={() => setGrantOpen(false)}
          onSuccess={() =>
            mutationSucceeded(
              "Entitlement grant applied. Records refreshed from the server.",
            )
          }
          onVerify={() =>
            authoritativeRefresh(
              "Grant outcome requires verification. Authoritative records are being refreshed.",
            )
          }
        />
      ) : null}
      {selected ? (
        <EntitlementDetailDrawer
          entitlement={selected}
          customerReference={references.customers[selected.customerId]}
          productReference={references.products[selected.productId]}
          onClose={() => setSelected(null)}
          onRevoke={() => {
            setRevokeTarget(selected);
            setSelected(null);
          }}
        />
      ) : null}
      {revokeTarget ? (
        <RevokeEntitlementDialog
          entitlement={revokeTarget}
          customerReference={references.customers[revokeTarget.customerId]}
          productReference={references.products[revokeTarget.productId]}
          onClose={() => setRevokeTarget(null)}
          onSuccess={() =>
            mutationSucceeded(
              "Entitlement revoked. Records refreshed from the server.",
            )
          }
          onVerify={(conflict) =>
            authoritativeRefresh(
              conflict
                ? "The entitlement changed in another session. Authoritative records are being refreshed."
                : "Revoke outcome requires verification. Authoritative records are being refreshed.",
            )
          }
        />
      ) : null}
    </div>
  );
}
