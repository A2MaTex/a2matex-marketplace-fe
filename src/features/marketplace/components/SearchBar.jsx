import { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { RiEqualizerLine } from "react-icons/ri";
import { IoChevronDownOutline } from "react-icons/io5";
import Button from "../../../common/components/common/Button";
import styles from "./SearchBar.module.css";

const QUICK_TAGS = [
  "TikTok Automation",
  "Facebook Automation",
  "Crypto Arbitrage Bot",
  "Telegram Marketing",
  "Social Multi-Account",
  "Fingerprint Spoofer",
];

const LICENSE_OPTIONS = ["Any Type", "Monthly", "Lifetime", "Free"];

const SearchBar = ({ onSearch, onFilter }) => {
  const [query, setQuery] = useState("");
  const [license, setLicense] = useState("Any Type");
  const [activeTag, setActiveTag] = useState("TikTok Automation");

  const handleTagClick = (tag) => {
    setActiveTag(tag);
    onSearch?.({ query: tag, license });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.({ query, license });
  };

  return (
    <div className={styles.wrap}>
      {/* ── Main search row ── */}
      <form className={styles.row} onSubmit={handleSubmit}>
        <div className={styles.inputWrap}>
          <IoSearchOutline className={styles.inputIcon} size={16} />
          <input
            type="search"
            className={styles.input}
            placeholder="Search compiled automations, target platforms, or authors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search marketplace"
          />
          <kbd className={styles.kbd}>Ctrl+F</kbd>
        </div>

        {/* License dropdown */}
        <div className={styles.selectWrap}>
          <select
            className={styles.select}
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            aria-label="License type"
          >
            {LICENSE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>License: {opt}</option>
            ))}
          </select>
          <IoChevronDownOutline className={styles.selectArrow} size={13} />
        </div>

        {/* Filter button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          leftIcon={<RiEqualizerLine size={15} />}
          onClick={() => onFilter?.()}
        >
          Filter
        </Button>
      </form>

      {/* ── Quick stack tags ── */}
      <div className={styles.tagsRow}>
        <span className={styles.tagsLabel}>QUICK STACK:</span>
        <div className={styles.tags}>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={[styles.tag, activeTag === tag ? styles.tagActive : ""].filter(Boolean).join(" ")}
              onClick={() => handleTagClick(tag)}
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
