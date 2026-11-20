import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import HeroSection from "../../components/HeroSection";
import ProductGrid from "../../components/ProductGrid";
import SearchBar from "../../components/SearchBar";
import { useMarketplaceProducts } from "../../hooks/useMarketplaceProducts";
import styles from "./Marketplace.module.css";

const PAGE_LIMIT = 10;

const parsePage = (value) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawQuery = searchParams.get("q") ?? "";
  const query = rawQuery.trim().slice(0, 100);
  const page = parsePage(searchParams.get("page") ?? "1");
  const productsState = useMarketplaceProducts({
    page,
    limit: PAGE_LIMIT,
    q: query,
  });

  const normalizedSearch = useMemo(() => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (page > 1) next.set("page", String(page));
    return next;
  }, [page, query]);

  useEffect(() => {
    if (normalizedSearch.toString() !== searchParams.toString()) {
      setSearchParams(normalizedSearch, { replace: true });
    }
  }, [normalizedSearch, searchParams, setSearchParams]);

  useEffect(() => {
    if (
      !productsState.loading &&
      !productsState.error &&
      page > 1 &&
      (productsState.data.totalPages === 0 ||
        page > productsState.data.totalPages)
    ) {
      const next = new URLSearchParams(normalizedSearch);
      next.delete("page");
      setSearchParams(next, { replace: true });
    }
  }, [
    normalizedSearch,
    page,
    productsState.data.totalPages,
    productsState.error,
    productsState.loading,
    setSearchParams,
  ]);

  const handleSearch = (nextQuery) => {
    const next = new URLSearchParams();
    if (nextQuery) next.set("q", nextQuery.slice(0, 100));
    setSearchParams(next);
  };

  const handlePageChange = (nextPage) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (nextPage > 1) next.set("page", String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      <HeroSection />

      <section className={styles.searchSection} aria-label="Marketplace search">
        <SearchBar
          key={query}
          initialQuery={query}
          onSearch={handleSearch}
          loading={productsState.loading}
        />
      </section>

      <section
        id="marketplace-catalog"
        className={styles.gridSection}
        aria-label="Marketplace products"
      >
        <ProductGrid
          data={productsState.data}
          loading={productsState.loading}
          error={productsState.error}
          query={query}
          onRetry={productsState.refetch}
          onPageChange={handlePageChange}
        />
      </section>
    </div>
  );
};

export default Marketplace;
