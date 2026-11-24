import { useEffect, useMemo, useState } from "react";
import { FiBox, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { formatCommerceDate } from "@/features/commerce/model/date";
import { useAdminReleasedProducts } from "../hooks/useAdminProductGovernance";
import {
  ADMIN_PRODUCT_PAGE_SIZE,
  PRODUCT_STATUSES,
  productFiltersToSearchParams,
  readAdminProductFilters,
} from "../model/adminProductContract";
import {
  ErrorState,
  LoadingState,
  Pagination,
} from "../components/GovernanceState";
import AdminProductImage from "../components/AdminProductImage";
import StatusBadge from "../components/StatusBadge";
import styles from "./AdminProductGovernance.module.css";

const DEFAULT_FILTERS = { status: "", page: 1, limit: ADMIN_PRODUCT_PAGE_SIZE };

export default function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const searchKey = searchParams.toString();
  const filters = useMemo(
    () => readAdminProductFilters(new URLSearchParams(searchKey)),
    [searchKey],
  );
  const [draftStatus, setDraftStatus] = useState(filters.status);
  const query = useMemo(
    () => ({
      ...(filters.status ? { status: filters.status } : {}),
      page: filters.page,
      limit: filters.limit,
    }),
    [filters],
  );
  const products = useAdminReleasedProducts({ query });
  const firstResult = products.data.totalItems
    ? (products.data.page - 1) * products.data.limit + 1
    : 0;
  const lastResult = Math.min(
    products.data.page * products.data.limit,
    products.data.totalItems,
  );

  useEffect(() => {
    queueMicrotask(() => setDraftStatus(filters.status));
  }, [filters.status]);
  useEffect(() => {
    if (
      products.loading ||
      products.error ||
      filters.page <= 1 ||
      products.data.totalPages === 0 ||
      filters.page <= products.data.totalPages
    )
      return;
    setSearchParams(
      productFiltersToSearchParams({
        ...filters,
        page: Math.max(products.data.totalPages, 1),
      }),
      { replace: true },
    );
  }, [
    filters,
    products.data.totalPages,
    products.error,
    products.loading,
    setSearchParams,
  ]);

  const applyFilter = (event) => {
    event.preventDefault();
    setSearchParams(
      productFiltersToSearchParams({
        ...filters,
        status: draftStatus,
        page: 1,
      }),
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Marketplace governance</span>
          <h1>Product Releases</h1>
          <p>
            Manage Products with published release evidence and inspect their
            current release state.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.totalBadge}>
            <FiBox aria-hidden="true" />
            {products.loading
              ? "Loading"
              : `${products.data.totalItems} released products`}
          </span>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={products.refetch}
            disabled={products.loading}
          >
            <FiRefreshCw aria-hidden="true" /> Refresh
          </button>
        </div>
      </header>

      <form className={styles.filters} onSubmit={applyFilter}>
        <div className={styles.filterHeading}>
          <span>Directory filters</span>
          {filters.status ? (
            <button
              type="button"
              onClick={() => {
                setDraftStatus("");
                setSearchParams(productFiltersToSearchParams(DEFAULT_FILTERS));
              }}
            >
              Clear all
            </button>
          ) : null}
        </div>
        <div className={styles.filterGrid}>
          <label className={styles.field}>
            <span>Product status</span>
            <select
              value={draftStatus}
              onChange={(event) => setDraftStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {PRODUCT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={styles.primaryButton}>
            Apply filter
          </button>
        </div>
      </form>

      <section className={styles.directory} aria-live="polite">
        <div className={styles.directoryHeader}>
          <div>
            <span className={styles.eyebrow}>Released Product directory</span>
            <h2>
              {filters.status ? "Filtered releases" : "All released products"}
            </h2>
          </div>
          {!products.loading && !products.error ? (
            <span>
              {firstResult}–{lastResult} of {products.data.totalItems}
            </span>
          ) : null}
        </div>
        {products.loading ? (
          <LoadingState label="Loading Products…" />
        ) : products.error ? (
          <ErrorState error={products.error} onRetry={products.refetch} />
        ) : products.data.items.length === 0 ? (
          <div className={styles.statePanel}>
            <h3>No released Products found</h3>
            <p>
              No Product with a published or disabled release matches this status.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Product status</th>
                  <th>Publisher</th>
                  <th>Project</th>
                  <th>Current release</th>
                  <th>Updated</th>
                  <th>
                    <span className={styles.srOnly}>Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.data.items.map((product) => {
                  const detailUrl = `/admin/products/${product.id}`;
                  return (
                    <tr key={product.id}>
                      <td data-label="Product">
                        <div className={styles.productCell}>
                          <AdminProductImage product={product} />
                          <div className={styles.cellTitle}>
                            <Link
                              to={detailUrl}
                              state={{
                                from: `${location.pathname}${location.search}`,
                              }}
                            >
                              {product.name || "Untitled Product"}
                            </Link>
                            <small>{product.slug || product.id}</small>
                          </div>
                        </div>
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={product.status} />
                      </td>
                      <td data-label="Publisher">
                        <div className={styles.cellTitle}>
                          <Link
                            to={`/admin/publishers/${product.publisherAccountId}`}
                          >
                            {product.publisher?.profile?.fullName ||
                              product.publisher?.user?.username ||
                              "Publisher unavailable"}
                          </Link>
                          <small>
                            {product.publisher?.user?.username
                              ? `@${product.publisher.user.username}`
                              : "Profile unavailable"}
                          </small>
                        </div>
                      </td>
                      <td data-label="Project">
                        <div className={styles.cellTitle}>
                          <span>
                            {product.project.name || "Untitled project"}
                          </span>
                        </div>
                      </td>
                      <td data-label="Current release">
                        {product.currentRelease ? (
                          <div className={styles.cellTitle}>
                            <Link
                              to={`/admin/products/${product.id}/releases/${product.currentRelease.id}`}
                              state={{
                                from: `${location.pathname}${location.search}`,
                              }}
                            >
                              v{product.currentRelease.version}
                            </Link>
                          </div>
                        ) : (
                          <span className={styles.muted}>
                            No current release
                          </span>
                        )}
                      </td>
                      <td data-label="Updated">
                        {formatCommerceDate(product.updatedAt, {
                          withTime: true,
                        })}
                      </td>
                      <td data-label="Action">
                        <Link
                          className={styles.viewLink}
                          to={detailUrl}
                          state={{
                            from: `${location.pathname}${location.search}`,
                          }}
                        >
                          View <FiChevronRight aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={products.data.page}
          totalPages={products.data.totalPages}
          totalItems={products.data.totalItems}
          onChange={(page) =>
            setSearchParams(productFiltersToSearchParams({ ...filters, page }))
          }
        />
      </section>
    </div>
  );
}
