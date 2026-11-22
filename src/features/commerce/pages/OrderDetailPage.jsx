import { Link, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import {
  CommerceError,
  CommerceLoading,
} from "../components/CommercePageState";
import OrderStatusBadge from "../components/OrderStatusBadge";
import { useOrderDetail } from "../hooks/useOrderDetail";
import { formatCommerceDate } from "../model/date";
import { formatVndAmount } from "../model/money";
import styles from "../components/CommercePages.module.css";

const offerTypeLabel = (type) =>
  type === "ONE_TIME" ? "One-time access" : "Subscription";

export default function OrderDetailPage() {
  const { orderId = "" } = useParams();
  const order = useOrderDetail(orderId);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link className={styles.backLink} to="/orders">
          <FiArrowLeft aria-hidden="true" /> Back to order history
        </Link>

        {order.loading ? <CommerceLoading label="Loading order detail" /> : null}
        {!order.loading && order.error ? (
          <CommerceError
            error={order.error}
            onRetry={order.error.status === 404 ? null : order.refetch}
            returnTo={`/orders/${orderId}`}
          />
        ) : null}

        {!order.loading && !order.error && order.data ? (
          <article className={styles.detailCard}>
            <header className={styles.detailHero}>
              <div>
                <span className={styles.eyebrow}>Paid order</span>
                <h1>{order.data.product.name?.trim() || "Unavailable product"}</h1>
                <p>{order.data.id}</p>
              </div>
              <OrderStatusBadge status={order.data.status} />
            </header>

            <div className={styles.detailSections}>
              <section className={styles.detailSection}>
                <h2>Transaction</h2>
                <dl className={styles.detailList}>
                  <div className={styles.detailItem}>
                    <dt>Order ID</dt><dd>{order.data.id}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>Paid at</dt><dd>{formatCommerceDate(order.data.createdAt, { withTime: true })}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>Unit price</dt><dd>{formatVndAmount(order.data.unitPriceAmount)}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>Total paid</dt><dd>{formatVndAmount(order.data.totalAmount)}</dd>
                  </div>
                </dl>
              </section>

              <section className={styles.detailSection}>
                <h2>Access snapshot</h2>
                <dl className={styles.detailList}>
                  <div className={styles.detailItem}>
                    <dt>Product</dt>
                    <dd>
                      <Link className={styles.detailProductLink} to={`/products/${order.data.product.id}`}>
                        {order.data.product.name?.trim() || "View product"}
                      </Link>
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>Offer type</dt><dd>{offerTypeLabel(order.data.offerSnapshot.offerType)}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>Duration</dt>
                    <dd>{order.data.offerSnapshot.offerType === "ONE_TIME" ? "Lifetime" : `${order.data.offerSnapshot.durationDays} days`}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>Snapshot price</dt><dd>{formatVndAmount(order.data.offerSnapshot.priceAmount)}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </article>
        ) : null}
      </div>
    </main>
  );
}
