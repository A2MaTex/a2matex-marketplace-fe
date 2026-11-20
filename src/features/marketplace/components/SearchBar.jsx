import { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import Button from "@components/common/Button";
import styles from "./SearchBar.module.css";

const QUICK_SEARCHES = [
  "TikTok automation",
  "Browser automation",
  "Telegram",
  "E-commerce",
];

const SearchBar = ({ initialQuery = "", onSearch, loading }) => {
  const [query, setQuery] = useState(initialQuery);

  const submit = (nextQuery) => {
    const normalized = nextQuery.trim();
    onSearch?.(normalized);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submit(query);
  };

  const clearSearch = () => {
    setQuery("");
    submit("");
  };

  return (
    <div className={styles.wrap}>
      <form className={styles.row} onSubmit={handleSubmit} role="search">
        <div className={styles.inputWrap}>
          <IoSearchOutline className={styles.inputIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.input}
            placeholder="Search by product name or description…"
            value={query}
            maxLength={100}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search marketplace"
          />
          {query ? (
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearSearch}
              aria-label="Clear search"
            >
              Clear
            </button>
          ) : null}
        </div>

        <Button
          className={styles.searchButton}
          type="submit"
          variant="primary"
          size="md"
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      <div className={styles.tagsRow} aria-label="Suggested searches">
        <span className={styles.tagsLabel}>TRY SEARCHING</span>
        <div className={styles.tags}>
          {QUICK_SEARCHES.map((tag) => (
            <button
              key={tag}
              type="button"
              className={styles.tag}
              onClick={() => {
                setQuery(tag);
                submit(tag);
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
