import { FiAlertTriangle, FiPackage, FiRefreshCw } from "react-icons/fi";
import MarketplacePagination from "./MarketplacePagination";
import ProductCard from "./ProductCard";
import styles from "./ProductGrid.module.css";

const ProductSkeleton = () => (
  <div className={styles.skeleton} aria-hidden="true">
    <span className={styles.skeletonVisual} />
    <span />
    <span />
    <span />
  </div>
);

const ProductGrid = ({
  data,
  loading,
  error,
  query,
  onRetry,
  onPageChange,
}) => {
  const hasProducts = data.items.length > 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <p className={styles.count} aria-live="polite">
          {loading && !hasProducts ? (
            "Loading published tools…"
          ) : (
            <>
              <strong>{data.totalItems.toLocaleString("vi-VN")}</strong>{" "}
              published {data.totalItems === 1 ? "tool" : "tools"}
              {query ? <> matching “{query}”</> : null}
            </>
          )}
        </p>
        <span className={styles.orderNote}>Newest releases first</span>
      </div>

      {error ? (
        <div className={styles.stateCard} role="alert">
          <FiAlertTriangle aria-hidden="true" />
          <h2>Marketplace unavailable</h2>
          <p>{error.message}</p>
          <button type="button" onClick={onRetry}>
            <FiRefreshCw aria-hidden="true" /> Try again
          </button>
        </div>
      ) : loading && !hasProducts ? (
        <div className={styles.grid} aria-label="Loading products">
          {Array.from({ length: 6 }, (_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      ) : !hasProducts ? (
        <div className={styles.stateCard}>
          <FiPackage aria-hidden="true" />
          <h2>{query ? "No matching tools" : "No published tools yet"}</h2>
          <p>
            {query
              ? "Try a different product name or description."
              : "Published products will appear here when they are ready."}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.grid} aria-busy={loading}>
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <MarketplacePagination
            page={data.page}
            totalPages={data.totalPages}
            loading={loading}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  );
};

export default ProductGrid;
