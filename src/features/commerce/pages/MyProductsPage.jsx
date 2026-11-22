import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiArrowUpRight, FiBox, FiInfo, FiLifeBuoy } from "react-icons/fi";
import CommercePagination from "../components/CommercePagination";
import {
  CommerceEmpty,
  CommerceError,
  CommerceLoading,
} from "../components/CommercePageState";
import EntitlementStatusBadge from "../components/EntitlementStatusBadge";
import { useMyEntitlements } from "../hooks/useMyEntitlements";
import { formatCommerceDate } from "../model/date";
import {
  buildCommercePageSearch,
  parseCommercePage,
} from "../model/pagination";
import styles from "../components/CommercePages.module.css";

const PAGE_SIZE = 12;

const STATUS_COPY = {
  ACTIVE: "This access is active. View the marketplace product for details and usage instructions.",
  EXPIRED: "This access period ended. View the product to choose a new subscription offer.",
  REVOKED: "This access was revoked. Contact support before attempting another purchase.",
};

export default function MyProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseCommercePage(searchParams.get("page") ?? "1");
  const entitlements = useMyEntitlements({ page, limit: PAGE_SIZE });
  const normalizedSearch = useMemo(() => buildCommercePageSearch(page), [page]);

  useEffect(() => {
    if (normalizedSearch.toString() !== searchParams.toString()) {
      setSearchParams(normalizedSearch, { replace: true });
    }
  }, [normalizedSearch, searchParams, setSearchParams]);

  useEffect(() => {
    if (
      !entitlements.loading &&
      !entitlements.error &&
      page > 1 &&
      (entitlements.data.totalPages === 0 || page > entitlements.data.totalPages)
    ) {
      setSearchParams(new URLSearchParams(), { replace: true });
    }
  }, [entitlements.data.totalPages, entitlements.error, entitlements.loading, page, setSearchParams]);

  const changePage = (nextPage) => {
    setSearchParams(buildCommercePageSearch(nextPage));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>Account · Access library</span>
            <h1>My products</h1>
            <p>
              Your current and historical access rights. Statuses come directly
              from the server and are never recalculated from your device clock.
            </p>
          </div>
          {!entitlements.loading && !entitlements.error ? (
            <div className={styles.count}>
              <strong>{entitlements.data.totalItems}</strong>
              <span>Access records</span>
            </div>
          ) : null}
        </header>

        <div className={styles.notice}>
          <FiInfo aria-hidden="true" />
          <span>This list includes active, expired and revoked access. Counts represent all records returned by the server, not a client-side status filter.</span>
        </div>

        {entitlements.loading ? <CommerceLoading label="Loading products" /> : null}
        {!entitlements.loading && entitlements.error ? (
          <CommerceError error={entitlements.error} onRetry={entitlements.refetch} returnTo="/my-products" />
        ) : null}
        {!entitlements.loading && !entitlements.error && entitlements.data.items.length === 0 ? (
          <CommerceEmpty
            title="No product access yet"
            message="Purchase an offer in the Marketplace and its entitlement will appear here."
            actionLabel="Explore Marketplace"
          />
        ) : null}

        {!entitlements.loading && !entitlements.error && entitlements.data.items.length > 0 ? (
          <>
            <section className={styles.productGrid} aria-label="Your product access">
              {entitlements.data.items.map((entitlement) => {
                const product = entitlement.product;
                const productId = product?.id ?? entitlement.productId;
                const name = product?.name?.trim() || "Unavailable product";
                const publisher = entitlement.publisher?.displayName?.trim() || "Publisher unavailable";
                return (
                  <article className={styles.productCard} key={entitlement.id}>
                    <div className={styles.productHeader}>
                      <span className={styles.productIcon}><FiBox aria-hidden="true" /></span>
                      <div className={styles.productTitle}>
                        <h2>{name}</h2>
                        <span className={styles.publisher}>{publisher}</span>
                      </div>
                      <EntitlementStatusBadge status={entitlement.status} />
                    </div>

                    <dl className={styles.productMeta}>
                      <div>
                        <dt>Access started</dt>
                        <dd>{formatCommerceDate(entitlement.startsAt)}</dd>
                      </div>
                      <div>
                        <dt>Access expires</dt>
                        <dd>{entitlement.expiresAt ? formatCommerceDate(entitlement.expiresAt) : "Lifetime"}</dd>
                      </div>
                    </dl>

                    <p className={styles.cardMessage}>{STATUS_COPY[entitlement.status]}</p>
                    <div className={styles.productActions}>
                      <span className={styles.publisher}>
                        {entitlement.grantSource === "ORDER" ? "Purchased access" : "Granted by administrator"}
                      </span>
                      {entitlement.status === "REVOKED" ? (
                        <span className={styles.supportLabel}><FiLifeBuoy aria-hidden="true" /> Contact support</span>
                      ) : productId ? (
                        <Link className={styles.productLink} to={`/products/${productId}`}>
                          {entitlement.status === "ACTIVE" ? "View product" : "View renewal offers"}
                          <FiArrowUpRight aria-hidden="true" />
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </section>
            <CommercePagination
              page={entitlements.data.page}
              totalPages={entitlements.data.totalPages}
              loading={entitlements.loading}
              onPageChange={changePage}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}
