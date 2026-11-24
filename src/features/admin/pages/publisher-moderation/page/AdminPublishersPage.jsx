import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiUserCheck,
} from "react-icons/fi";
import { formatCommerceDate } from "@/features/commerce/model/date";
import AdminUserStatusBadge from "../../user-manage/components/AdminUserStatusBadge";
import PublisherStatusBadge from "../components/PublisherStatusBadge";
import { useAdminPublishers } from "../hooks/useAdminPublishers";
import {
  ADMIN_PUBLISHER_PAGE_SIZE,
  buildAdminPublisherQuery,
  publisherFiltersToSearchParams,
  readAdminPublisherFilters,
} from "../model/adminPublisherContract";
import base from "../../user-manage/page/UserManage.module.css";
import styles from "./AdminPublisherModeration.module.css";

const FILTER_DEFAULTS = {
  status: "",
  page: 1,
  pageSize: ADMIN_PUBLISHER_PAGE_SIZE,
};

const initials = (publisher) => {
  const source = publisher.profile?.fullName || publisher.user.username || "P";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const formatDate = (value) =>
  value ? formatCommerceDate(value) : <span className={base.muted}>—</span>;

export default function AdminPublishersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const searchKey = searchParams.toString();
  const activeFilters = useMemo(
    () => readAdminPublisherFilters(new URLSearchParams(searchKey)),
    [searchKey],
  );
  const [filters, setFilters] = useState(activeFilters);

  useEffect(() => {
    queueMicrotask(() => setFilters(activeFilters));
  }, [activeFilters]);

  const query = useMemo(
    () => buildAdminPublisherQuery(activeFilters),
    [activeFilters],
  );
  const publishers = useAdminPublishers({ query });

  useEffect(() => {
    if (
      publishers.loading ||
      publishers.error ||
      activeFilters.page <= 1 ||
      (publishers.data.totalPages > 0 &&
        activeFilters.page <= publishers.data.totalPages)
    ) {
      return;
    }
    setSearchParams(
      publisherFiltersToSearchParams({
        ...activeFilters,
        page: Math.max(publishers.data.totalPages, 1),
      }),
      { replace: true },
    );
  }, [
    activeFilters,
    publishers.data.totalPages,
    publishers.error,
    publishers.loading,
    setSearchParams,
  ]);

  const applyFilters = (event) => {
    event.preventDefault();
    setSearchParams(
      publisherFiltersToSearchParams({ ...filters, page: 1 }),
    );
  };

  const clearFilters = () => {
    setFilters(FILTER_DEFAULTS);
    setSearchParams(new URLSearchParams());
  };

  const changePage = (page) => {
    setSearchParams(
      publisherFiltersToSearchParams({ ...activeFilters, page }),
    );
  };

  const firstResult = publishers.data.totalItems
    ? (publishers.data.page - 1) * publishers.data.pageSize + 1
    : 0;
  const lastResult = Math.min(
    publishers.data.page * publishers.data.pageSize,
    publishers.data.totalItems,
  );
  const hasFilters = Boolean(activeFilters.status);

  return (
    <div className={base.page}>
      <header className={base.pageHeader}>
        <div>
          <span className={base.eyebrow}>Identity &amp; Access</span>
          <h1>Publisher Moderation</h1>
          <p>Inspect Publisher access, Terms compliance and moderation state.</p>
        </div>
        <div className={base.headerActions}>
          <span className={base.totalBadge}>
            <FiUserCheck aria-hidden="true" />
            {publishers.loading
              ? "Loading"
              : `${publishers.data.totalItems} Publishers`}
          </span>
          <button
            type="button"
            className={base.secondaryButton}
            onClick={publishers.refetch}
            disabled={publishers.loading}
          >
            <FiRefreshCw aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      <form className={base.filters} onSubmit={applyFilters}>
        <div className={base.filterHeading}>
          <div><span>Directory filters</span></div>
          {hasFilters ? (
            <button type="button" onClick={clearFilters}>Clear all</button>
          ) : null}
        </div>
        <div className={`${base.filterGrid} ${styles.compactFilterGrid}`}>
          <label className={base.field}>
            <span>Publisher status</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </label>
          <button type="submit" className={base.primaryButton}>
            Apply filter
          </button>
        </div>
      </form>

      <section className={base.directory} aria-live="polite">
        <div className={base.directoryHeader}>
          <div>
            <span className={base.eyebrow}>Publisher directory</span>
            <h2>{hasFilters ? "Filtered Publishers" : "All Publishers"}</h2>
          </div>
          {!publishers.loading && !publishers.error ? (
            <span>{firstResult}–{lastResult} of {publishers.data.totalItems}</span>
          ) : null}
        </div>

        {publishers.loading ? (
          <div className={base.loadingState} aria-busy="true">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={base.skeletonRow} />
            ))}
            <span className={base.srOnly}>Loading Publisher accounts…</span>
          </div>
        ) : publishers.error ? (
          <div className={base.statePanel} role="alert">
            <div className={base.stateIcon}>!</div>
            <h3>
              {publishers.error.status === 403
                ? "Administrator permission required"
                : "Unable to load Publishers"}
            </h3>
            <p>{publishers.error.message}</p>
            {publishers.error.retryable ? (
              <button
                type="button"
                className={base.secondaryButton}
                onClick={publishers.refetch}
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : publishers.data.items.length === 0 ? (
          <div className={base.statePanel}>
            <h3>No Publishers found</h3>
            <p>Adjust the status filter or clear it to view the full directory.</p>
            {hasFilters ? (
              <button
                type="button"
                className={base.secondaryButton}
                onClick={clearFilters}
              >
                Clear filter
              </button>
            ) : null}
          </div>
        ) : (
          <div className={base.tableWrap}>
            <table className={`${base.table} ${styles.publisherTable}`}>
              <thead>
                <tr>
                  <th>Publisher</th>
                  <th>Publisher status</th>
                  <th>User status</th>
                  <th>Activated</th>
                  <th>Blocked at</th>
                  <th><span className={base.srOnly}>Action</span></th>
                </tr>
              </thead>
              <tbody>
                {publishers.data.items.map((publisher) => {
                  const detailUrl = `/admin/publishers/${publisher.id}`;
                  return (
                    <tr key={publisher.id}>
                      <td>
                        <div className={`${base.userCell} ${styles.publisherCell}`}>
                          <div className={base.avatar} aria-hidden="true">
                            {initials(publisher)}
                          </div>
                          <div>
                            <Link
                              to={detailUrl}
                              state={{ from: `${location.pathname}${location.search}` }}
                            >
                              {publisher.profile?.fullName || publisher.user.username}
                            </Link>
                            <span>
                              @{publisher.user.username}
                              {publisher.profile?.email
                                ? ` · ${publisher.profile.email}`
                                : " · No profile email"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td><PublisherStatusBadge status={publisher.status} /></td>
                      <td><AdminUserStatusBadge status={publisher.user.status} /></td>
                      <td>
                        <time dateTime={publisher.activatedAt} title={publisher.activatedAt}>
                          {formatDate(publisher.activatedAt)}
                        </time>
                      </td>
                      <td>
                        {publisher.blockedAt ? (
                          <time dateTime={publisher.blockedAt} title={publisher.blockedAt}>
                            {formatDate(publisher.blockedAt)}
                          </time>
                        ) : <span className={base.muted}>—</span>}
                      </td>
                      <td>
                        <Link
                          className={base.viewLink}
                          to={detailUrl}
                          state={{ from: `${location.pathname}${location.search}` }}
                        >
                          View details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!publishers.loading &&
        !publishers.error &&
        publishers.data.totalPages > 1 ? (
          <footer className={base.pagination}>
            <span>Page {publishers.data.page} of {publishers.data.totalPages}</span>
            <div>
              <button
                type="button"
                onClick={() => changePage(publishers.data.page - 1)}
                disabled={publishers.data.page <= 1}
                aria-label="Previous page"
              >
                <FiChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => changePage(publishers.data.page + 1)}
                disabled={publishers.data.page >= publishers.data.totalPages}
                aria-label="Next page"
              >
                <FiChevronRight aria-hidden="true" />
              </button>
            </div>
          </footer>
        ) : null}
      </section>
    </div>
  );
}
