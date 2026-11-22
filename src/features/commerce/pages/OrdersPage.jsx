import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiCalendar, FiFileText } from "react-icons/fi";
import CommercePagination from "../components/CommercePagination";
import {
  CommerceEmpty,
  CommerceError,
  CommerceLoading,
} from "../components/CommercePageState";
import OrderStatusBadge from "../components/OrderStatusBadge";
import { useMyOrders } from "../hooks/useMyOrders";
import { formatCommerceDate } from "../model/date";
import { formatVndAmount } from "../model/money";
import {
  buildCommercePageSearch,
  parseCommercePage,
} from "../model/pagination";
import styles from "../components/CommercePages.module.css";

const PAGE_SIZE = 10;

const productName = (order) =>
  order.product?.name?.trim() || "Unavailable product";

const offerLabel = (snapshot) =>
  snapshot.offerType === "ONE_TIME"
    ? "One-time · Lifetime"
    : `Subscription · ${snapshot.durationDays} days`;

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseCommercePage(searchParams.get("page") ?? "1");
  const orders = useMyOrders({ page, limit: PAGE_SIZE });
  const normalizedSearch = useMemo(() => buildCommercePageSearch(page), [page]);

  useEffect(() => {
    if (normalizedSearch.toString() !== searchParams.toString()) {
      setSearchParams(normalizedSearch, { replace: true });
    }
  }, [normalizedSearch, searchParams, setSearchParams]);

  useEffect(() => {
    if (
      !orders.loading &&
      !orders.error &&
      page > 1 &&
      (orders.data.totalPages === 0 || page > orders.data.totalPages)
    ) {
      setSearchParams(new URLSearchParams(), { replace: true });
    }
  }, [orders.data.totalPages, orders.error, orders.loading, page, setSearchParams]);

  const changePage = (nextPage) => {
    setSearchParams(buildCommercePageSearch(nextPage));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>Account · Transactions</span>
            <h1>Order history</h1>
            <p>
              Every purchase is shown with the immutable price and access terms
              captured when the order was paid.
            </p>
          </div>
          {!orders.loading && !orders.error ? (
            <div className={styles.count}>
              <strong>{orders.data.totalItems}</strong>
              <span>Total orders</span>
            </div>
          ) : null}
        </header>

        {orders.loading ? <CommerceLoading label="Loading orders" /> : null}
        {!orders.loading && orders.error ? (
          <CommerceError error={orders.error} onRetry={orders.refetch} returnTo="/orders" />
        ) : null}
        {!orders.loading && !orders.error && orders.data.items.length === 0 ? (
          <CommerceEmpty
            title="No orders yet"
            message="When you purchase an access offer, the paid order will appear here."
            actionLabel="Explore Marketplace"
          />
        ) : null}

        {!orders.loading && !orders.error && orders.data.items.length > 0 ? (
          <>
            <section className={styles.orderList} aria-label="Your orders">
              {orders.data.items.map((order) => (
                <Link className={styles.orderCard} to={`/orders/${order.id}`} key={order.id}>
                  <div className={styles.orderPrimary}>
                    <span className={styles.orderIcon}><FiFileText aria-hidden="true" /></span>
                    <div className={styles.orderCopy}>
                      <h2>{productName(order)}</h2>
                      <div className={styles.orderMeta}>
                        <span><FiCalendar aria-hidden="true" /> {formatCommerceDate(order.createdAt, { withTime: true })}</span>
                        <span>#{order.id.slice(0, 8)}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                  </div>
                  <div className={styles.offerSummary}>
                    <span>Access terms</span>
                    <strong>{offerLabel(order.offerSnapshot)}</strong>
                  </div>
                  <div className={styles.amount}>
                    <span>Total paid</span>
                    <strong>{formatVndAmount(order.totalAmount)}</strong>
                  </div>
                </Link>
              ))}
            </section>
            <CommercePagination
              page={orders.data.page}
              totalPages={orders.data.totalPages}
              loading={orders.loading}
              onPageChange={changePage}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}
