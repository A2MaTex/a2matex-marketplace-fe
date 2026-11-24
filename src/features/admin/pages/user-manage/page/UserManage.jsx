import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiSearch,
  FiUsers,
} from "react-icons/fi";
import { formatCommerceDate } from "@/features/commerce/model/date";
import { useAdminUsers } from "../hooks/useAdminUsers";
import {
  ADMIN_USER_PAGE_SIZE,
  ADMIN_USER_SEARCH_MAX_LENGTH,
  buildAdminUserQuery,
  filtersToSearchParams,
  readAdminUserFilters,
} from "../model/adminUserModel";
import { toAdminUserError } from "../model/adminUserError";
import AdminUserStatusBadge from "../components/AdminUserStatusBadge";
import styles from "./UserManage.module.css";

const FILTER_DEFAULTS = {
  q: "",
  status: "",
  role: "",
  publisherStatus: "",
  createdFrom: "",
  createdTo: "",
  page: 1,
};

const initials = (user) => {
  const source = user.displayName || user.username || "U";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export default function UserManage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const searchKey = searchParams.toString();
  const activeFilters = useMemo(
    () => readAdminUserFilters(new URLSearchParams(searchKey)),
    [searchKey],
  );
  const [filters, setFilters] = useState(activeFilters);
  const [filterError, setFilterError] = useState(null);

  useEffect(() => {
    queueMicrotask(() => setFilters(activeFilters));
  }, [activeFilters]);

  const queryState = useMemo(() => {
    try {
      return { query: buildAdminUserQuery(activeFilters), error: null };
    } catch (error) {
      return {
        query: { page: activeFilters.page, pageSize: ADMIN_USER_PAGE_SIZE },
        error: toAdminUserError(error),
      };
    }
  }, [activeFilters]);
  const users = useAdminUsers({
    query: queryState.query,
    enabled: !queryState.error,
  });

  useEffect(() => {
    if (
      users.loading ||
      users.error ||
      queryState.error ||
      activeFilters.page <= 1 ||
      (users.data.totalPages > 0 && activeFilters.page <= users.data.totalPages)
    ) {
      return;
    }
    const nextPage = Math.max(users.data.totalPages, 1);
    setSearchParams(
      filtersToSearchParams({ ...activeFilters, page: nextPage }),
      { replace: true },
    );
  }, [
    activeFilters,
    queryState.error,
    setSearchParams,
    users.data.totalPages,
    users.error,
    users.loading,
  ]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value, page: 1 }));
    setFilterError(null);
  };

  const applyFilters = (event) => {
    event.preventDefault();
    try {
      buildAdminUserQuery({ ...filters, page: 1 });
      setFilterError(null);
      setSearchParams(filtersToSearchParams({ ...filters, page: 1 }));
    } catch (error) {
      setFilterError(toAdminUserError(error));
    }
  };

  const clearFilters = () => {
    setFilters(FILTER_DEFAULTS);
    setFilterError(null);
    setSearchParams(new URLSearchParams());
  };

  const changePage = (page) => {
    setSearchParams(filtersToSearchParams({ ...activeFilters, page }));
  };

  const effectiveError = queryState.error ?? users.error;
  const firstResult = users.data.totalItems
    ? (users.data.page - 1) * users.data.pageSize + 1
    : 0;
  const lastResult = Math.min(
    users.data.page * users.data.pageSize,
    users.data.totalItems,
  );
  const hasFilters = Object.entries(activeFilters).some(
    ([key, value]) => key !== "page" && Boolean(value),
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Identity &amp; Access</span>
          <h1>User Management</h1>
          <p>Search accounts, inspect access and manage account status.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.totalBadge}>
            <FiUsers aria-hidden="true" />
            {users.loading ? "Loading" : `${users.data.totalItems} users`}
          </span>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={users.refetch}
            disabled={users.loading || Boolean(queryState.error)}
          >
            <FiRefreshCw aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      <form className={styles.filters} onSubmit={applyFilters} noValidate>
        <div className={styles.filterHeading}>
          <div>
            <span>Directory filters</span>
          </div>
          {hasFilters ? (
            <button type="button" onClick={clearFilters}>
              Clear all
            </button>
          ) : null}
        </div>

        {filterError ? (
          <div className={styles.formError} role="alert">
            {filterError.message}
          </div>
        ) : null}

        <div className={styles.filterGrid}>
          <label className={`${styles.field} ${styles.searchField}`}>
            <span>Search</span>
            <div className={styles.inputWithIcon}>
              <FiSearch aria-hidden="true" />
              <input
                value={filters.q}
                onChange={(event) => updateFilter("q", event.target.value)}
                maxLength={ADMIN_USER_SEARCH_MAX_LENGTH}
                placeholder="Name, username or email"
              />
            </div>
          </label>
          <label className={styles.field}>
            <span>User status</span>
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BANNED">Banned</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Role</span>
            <select
              value={filters.role}
              onChange={(event) => updateFilter("role", event.target.value)}
            >
              <option value="">All roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="PUBLISHER">Publisher</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Publisher status</span>
            <select
              value={filters.publisherStatus}
              onChange={(event) =>
                updateFilter("publisherStatus", event.target.value)
              }
            >
              <option value="">Any publisher state</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Created from</span>
            <input
              type="date"
              value={filters.createdFrom}
              onChange={(event) =>
                updateFilter("createdFrom", event.target.value)
              }
            />
          </label>
          <label className={styles.field}>
            <span>Created to</span>
            <input
              type="date"
              value={filters.createdTo}
              onChange={(event) =>
                updateFilter("createdTo", event.target.value)
              }
            />
          </label>
          <button type="submit" className={styles.primaryButton}>
            Apply filters
          </button>
        </div>
      </form>

      <section className={styles.directory} aria-live="polite">
        <div className={styles.directoryHeader}>
          <div>
            <span className={styles.eyebrow}>Account directory</span>
            <h2>{hasFilters ? "Filtered users" : "All users"}</h2>
          </div>
          {!users.loading && !effectiveError ? (
            <span>
              {firstResult}–{lastResult} of {users.data.totalItems}
            </span>
          ) : null}
        </div>

        {users.loading ? (
          <div className={styles.loadingState} aria-busy="true">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={styles.skeletonRow} />
            ))}
            <span className={styles.srOnly}>Loading users…</span>
          </div>
        ) : effectiveError ? (
          <div className={styles.statePanel} role="alert">
            <div className={styles.stateIcon}>!</div>
            <h3>
              {effectiveError.status === 403
                ? "Administrator permission required"
                : "Unable to load users"}
            </h3>
            <p>{effectiveError.message}</p>
            {effectiveError.retryable ? (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={users.refetch}
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : users.data.items.length === 0 ? (
          <div className={styles.statePanel}>
            <h3>No users found</h3>
            <p>Adjust the filters or clear them to view the full directory.</p>
            {hasFilters ? (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={clearFilters}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>
                    <span className={styles.srOnly}>Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.data.items.map((user) => {
                  const detailUrl = `/admin/users/${user.id}`;
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.avatar} aria-hidden="true">
                            {initials(user)}
                          </div>
                          <div>
                            <Link
                              to={detailUrl}
                              state={{
                                from: `${location.pathname}${location.search}`,
                              }}
                            >
                              {user.displayName || user.username}
                            </Link>
                            <span>
                              @{user.username} · {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.roleList}>
                          {user.roles.map((role) => (
                            <span key={role}>{role}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <AdminUserStatusBadge status={user.status} />
                      </td>
                      <td>
                        <time dateTime={user.createdAt} title={user.createdAt}>
                          {formatCommerceDate(user.createdAt)}
                        </time>
                      </td>
                      <td>
                        <Link
                          className={styles.viewLink}
                          to={detailUrl}
                          state={{
                            from: `${location.pathname}${location.search}`,
                          }}
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

        {!users.loading && !effectiveError && users.data.totalPages > 1 ? (
          <footer className={styles.pagination}>
            <span>
              Page {users.data.page} of {users.data.totalPages}
            </span>
            <div>
              <button
                type="button"
                onClick={() => changePage(users.data.page - 1)}
                disabled={users.data.page <= 1}
                aria-label="Previous page"
              >
                <FiChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => changePage(users.data.page + 1)}
                disabled={users.data.page >= users.data.totalPages}
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
