import HeroSection from "../../components/HeroSection";
import SearchBar from "../../components/SearchBar";
import ProductGrid from "../../components/ProductGrid";
import styles from "./Marketplace.module.css";

const Marketplace = () => {
  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Search + filter */}
      <section className={styles.searchSection}>
        <SearchBar />
      </section>

      {/* Product listing */}
      <section className={styles.gridSection}>
        <ProductGrid />
      </section>
    </>
  );
};

export default Marketplace;
