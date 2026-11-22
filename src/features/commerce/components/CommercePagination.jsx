import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import styles from "./CommercePages.module.css";

export default function CommercePagination({
  page,
  totalPages,
  loading,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="Commerce pages">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={loading || page <= 1}
        aria-label="Previous page"
      >
        <FiChevronLeft aria-hidden="true" />
      </button>
      <span>
        Page <strong>{page}</strong> of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={loading || page >= totalPages}
        aria-label="Next page"
      >
        <FiChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
}
