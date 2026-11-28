import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MdChevronLeft,
  MdChevronRight,
  MdOutlineReceiptLong,
  MdRefresh,
} from "react-icons/md";
import { formatCommerceDate } from "@/features/commerce/model/date";
import { formatVndAmount } from "@/features/commerce/model/money";
import {
  WALLET_TRANSACTION_TYPES,
  WALLET_TRANSACTION_TYPE_LABELS,
} from "./model/adminWalletTransactionContract";
import {
  buildLedgerQuery,
  readLedgerFilters,
  validateLedgerFilters,
} from "./model/adminWalletTransactionRequest";
import { useAdminWalletTransactions } from "./hooks/useAdminWalletTransactions";
import base from "../user-manage/page/UserManage.module.css";
import styles from "./WalletTransactionsPage.module.css";

const positivePage = (value) => {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
};

const shortId = (value) => `${value.slice(0, 8)}…${value.slice(-6)}`;
const typeLabel = (type) => WALLET_TRANSACTION_TYPE_LABELS[type] ?? type;
const titleCase = (value) =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// Mỗi dòng chỉ mang một tham chiếu; hiện đúng cái có để truy ngược về nghiệp vụ gốc.
const REFERENCES = [
  ["orderId", "Order"],
  ["topUpTransactionId", "Top-up"],
  ["withdrawalRequestId", "Withdrawal"],
  ["transferId", "Transfer"],
];

function AccountCell({ entry }) {
  if (entry.systemAccount) {
    return (
      <div className={styles.accountCell}>
        <strong>{titleCase(entry.systemAccount)}</strong>
        <small>System account</small>
      </div>
    );
  }
  if (entry.userId) {
    return (
      <div className={styles.accountCell}>
        <strong>{shortId(entry.userId)}</strong>
        <small>User wallet</small>
      </div>
    );
  }
  return <span className={base.muted}>Unassigned</span>;
}

function ReferenceCell({ entry }) {
  const found = REFERENCES.find(([key]) => entry[key]);
  if (!found) return <span className={base.muted}>None</span>;
  const [key, label] = found;
  return (
    <div className={styles.accountCell}>
      <strong>{label}</strong>
      <small>{shortId(entry[key])}</small>
    </div>
  );
}

export default function WalletTransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const page = positivePage(searchParams.get("page"));
  const applied = useMemo(
    () => readLedgerFilters(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchKey],
  );
  const [filters, setFilters] = useState(applied);
  const [filterError, setFilterError] = useState("");

  useEffect(() => {
    queueMicrotask(() => setFilters(applied));
  }, [applied]);

  const urlError = validateLedgerFilters(applied);
  const validFilters = !urlError;
  const query = useMemo(
    () => buildLedgerQuery({ page, filters: applied }),
    [page, applied],
  );
  const ledger = useAdminWalletTransactions({ query, enabled: validFilters });

  const applyFilters = (event) => {
    event.preventDefault();
    const next = {
      userId: filters.userId.trim(),
      type: filters.type,
      from: filters.from,
      to: filters.to,
    };
    const message = validateLedgerFilters(next);
    if (message) {
      setFilterError(message);
      return;
    }
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setFilterError("");
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({ userId: "", type: "", from: "", to: "" });
    setFilterError("");
    setSearchParams(new URLSearchParams());
  };

  const changePage = (nextPage) => {
    const next = new URLSearchParams(searchKey);
    if (nextPage > 1) next.set("page", String(nextPage));
    else next.delete("page");
    setSearchParams(next);
  };

  const hasFilters = Object.values(applied).some(Boolean);
  const firstResult = ledger.data.totalItems
    ? (ledger.data.page - 1) * ledger.data.pageSize + 1
    : 0;
  const lastResult = Math.min(
    ledger.data.page * ledger.data.pageSize,
    ledger.data.totalItems,
  );

  return (
    <div className={base.page}>
      <header className={base.pageHeader}>
        <div>
          <span className={base.eyebrow}>Commerce</span>
          <h1>Wallet Transactions</h1>
          <p>
            Every balance movement the system recorded: top-ups, purchases,
            earnings, commission, admin grants, issued credit and withdrawals.
          </p>
        </div>
        <div className={base.headerActions}>
          <span className={base.totalBadge}>
            <MdOutlineReceiptLong aria-hidden="true" />
            {ledger.loading ? "Loading" : `${ledger.data.totalItems} Entries`}
          </span>
          <button
            type="button"
            className={base.secondaryButton}
            onClick={ledger.refetch}
            disabled={ledger.loading || !validFilters}
          >
            <MdRefresh aria-hidden="true" /> Refresh
          </button>
        </div>
      </header>

      <form className={base.filters} onSubmit={applyFilters} noValidate>
        <div className={base.filterHeading}>
          <div>
            <span>Filters</span>
          </div>
          {hasFilters ? (
            <button type="button" onClick={clearFilters}>
              Clear all
            </button>
          ) : null}
        </div>
        <div className={`${base.filterGrid} ${styles.filterGrid}`}>
          <label className={base.field}>
            <span>User UUID</span>
            <input
              value={filters.userId}
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  userId: event.target.value,
                }));
                setFilterError("");
              }}
              placeholder="Filter by exact User UUID"
            />
          </label>
          <label className={base.field}>
            <span>Type</span>
            <select
              value={filters.type}
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  type: event.target.value,
                }));
                setFilterError("");
              }}
            >
              <option value="">All types</option>
              {WALLET_TRANSACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {typeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className={base.field}>
            <span>From</span>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  from: event.target.value,
                }));
                setFilterError("");
              }}
            />
          </label>
          <label className={base.field}>
            <span>To</span>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  to: event.target.value,
                }));
                setFilterError("");
              }}
            />
          </label>
          <button type="submit" className={base.primaryButton}>
            Apply filters
          </button>
        </div>
        {filterError || urlError ? (
          <p className={base.formError} role="alert">
            {filterError || urlError}
          </p>
        ) : null}
      </form>

      <section className={base.directory} aria-live="polite">
        <div className={base.directoryHeader}>
          <div>
            <span className={base.eyebrow}>Ledger</span>
            <h2>{hasFilters ? "Filtered entries" : "All entries"}</h2>
          </div>
          {!ledger.loading && !ledger.error && validFilters ? (
            <span>
              {firstResult}–{lastResult} of {ledger.data.totalItems}
            </span>
          ) : null}
        </div>

        {ledger.loading ? (
          <div className={base.loadingState} aria-busy="true">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={base.skeletonRow} />
            ))}
            <span className={base.srOnly}>Loading ledger entries…</span>
          </div>
        ) : ledger.error ? (
          <div className={base.statePanel} role="alert">
            <div className={base.stateIcon}>!</div>
            <h3>
              {ledger.error.status === 403
                ? "Administrator permission required"
                : "Unable to load the wallet ledger"}
            </h3>
            <p>{ledger.error.message}</p>
            {ledger.error.retryable ? (
              <button
                type="button"
                className={base.secondaryButton}
                onClick={ledger.refetch}
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : !validFilters ? (
          <div className={base.statePanel}>
            <div className={base.stateIcon}>!</div>
            <h3>Invalid URL filters</h3>
            <p>{urlError}</p>
            <button
              type="button"
              className={base.secondaryButton}
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        ) : ledger.data.items.length === 0 ? (
          <div className={base.statePanel}>
            <div className={base.emptyIcon}>
              <MdOutlineReceiptLong aria-hidden="true" />
            </div>
            <h3>No matching entries</h3>
            <p>Change the filters, or wait for the next balance movement.</p>
            {hasFilters ? (
              <button
                type="button"
                className={base.secondaryButton}
                onClick={clearFilters}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className={base.tableWrap}>
            <table className={`${base.table} ${styles.ledgerTable}`}>
              <thead>
                <tr>
                  <th>Recorded</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th className={styles.numeric}>Amount</th>
                  <th className={styles.numeric}>Balance after</th>
                  <th>Reference</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {ledger.data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatCommerceDate(entry.createdAt, { withTime: true })}</td>
                    <td>
                      <AccountCell entry={entry} />
                    </td>
                    <td>{typeLabel(entry.type)}</td>
                    <td
                      className={`${styles.numeric} ${
                        entry.direction === "CREDIT"
                          ? styles.credit
                          : styles.debit
                      }`}
                    >
                      {entry.direction === "CREDIT" ? "+" : "−"}
                      {formatVndAmount(entry.amount)}
                    </td>
                    <td className={styles.numeric}>
                      {formatVndAmount(entry.balanceAfter)}
                    </td>
                    <td>
                      <ReferenceCell entry={entry} />
                    </td>
                    <td>
                      {entry.note ? (
                        <span className={styles.note}>{entry.note}</span>
                      ) : (
                        <span className={base.muted}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!ledger.loading &&
        !ledger.error &&
        validFilters &&
        ledger.data.totalPages > 1 ? (
          <footer className={base.pagination}>
            <span>
              Page {ledger.data.page} of {ledger.data.totalPages}
            </span>
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
                disabled={page >= ledger.data.totalPages}
                aria-label="Next page"
              >
                <MdChevronRight aria-hidden="true" />
              </button>
            </div>
          </footer>
        ) : null}
      </section>
    </div>
  );
}
