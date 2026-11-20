import { useMemo } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import StaticImage from "../components/StaticImage";
import styles from "./ProductDirectory.module.css";

const statusOptions = ["ALL", "DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED"];

const ProductIcon = ({ product }) => {
  const icon = product.media?.find((item) => item.type === "ICON");
  return icon ? (
    <StaticImage
      staticId={icon.staticId}
      variant="small"
      alt=""
      className={styles.productIcon}
    />
  ) : (
    <span className={styles.productIconFallback} aria-hidden="true"><FiImage /></span>
  );
};

const ProductDirectory = ({
  products,
  page,
  totalPages,
  loading,
  error,
  search,
  status,
  selectedProductId,
  onSearchChange,
  onStatusChange,
  onProductSelect,
  onPageChange,
  onNewProduct,
  onRetry,
}) => {
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.slug, product.project?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [products, search]);

  return (
    <section className={styles.directory} aria-label="Product directory">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Publisher catalog</p>
          <div className={styles.titleRow}>
            <h1>Products & Offers</h1>
          </div>
        </div>
        <button type="button" className={styles.newButton} onClick={onNewProduct}>
          <FiPlus aria-hidden="true" /> New product
        </button>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.searchBox}>
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search this page..."
            aria-label="Search products on the current page"
          />
        </label>
        <div className={styles.filters} aria-label="Filter products by status">
          {statusOptions.map((value) => (
            <button
              type="button"
              key={value}
              className={`${styles[`filter${value}`]} ${status === value ? styles.filterActive : ""}`}
              onClick={() => onStatusChange(value)}
              aria-pressed={status === value}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className={styles.loadingBar} aria-label="Loading products" /> : null}

      <div className={styles.productArea}>
        {error ? (
          <div className={styles.state} role="alert">
            <strong>Products unavailable</strong>
            <p>{error.message}</p>
            <button type="button" onClick={onRetry}><FiRefreshCw /> Retry</button>
          </div>
        ) : null}
        {!error && !loading && products.length === 0 ? (
          <div className={styles.state}>
            <strong>{status === "ALL" ? "No products yet" : `No ${status.toLowerCase()} products`}</strong>
            <p>{status === "ALL" ? "Create a product from an eligible active project." : `There are no products with ${status} status.`}</p>
            {status !== "ALL" ? <button type="button" onClick={() => onStatusChange("ALL")}>View all products</button> : null}
          </div>
        ) : null}
        {!error && products.length > 0 && filteredProducts.length === 0 ? (
          <div className={styles.state}>
            <strong>No match on this page</strong>
            <p>Search only filters the {products.length} products currently loaded.</p>
          </div>
        ) : null}
        {!error && !loading && filteredProducts.length > 0 ? (
          <ul className={styles.productList} aria-label="Publisher products">
            {filteredProducts.map((product) => {
              const selected = product.id === selectedProductId;
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    className={`${styles.productCard} ${selected ? styles.productCardSelected : ""}`}
                    onClick={() => onProductSelect(product.id)}
                    aria-current={selected ? "page" : undefined}
                  >
                    <ProductIcon product={product} />
                    <span className={styles.productCardBody}>
                      <strong>{product.name || "Untitled product"}</strong>
                      <small>{product.slug || "No slug"}</small>
                    </span>
                    <span className={`${styles.status} ${styles[`status${product.status}`]}`}>
                      {product.status}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {totalPages > 1 ? (
        <footer className={styles.pagination}>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={loading || page <= 1}
            aria-label="Previous product page"
          ><FiChevronLeft /></button>
          <span>Page <strong>{page}</strong> / {totalPages}</span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={loading || page >= totalPages}
            aria-label="Next product page"
          ><FiChevronRight /></button>
        </footer>
      ) : null}
    </section>
  );
};

export default ProductDirectory;
