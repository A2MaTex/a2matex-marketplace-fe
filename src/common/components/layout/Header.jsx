import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { IoSearchOutline } from "react-icons/io5";
import { IoCashOutline } from "react-icons/io5";
import { IoPersonCircleOutline } from "react-icons/io5";
import styles from "./Header.module.css";
import { useAuthStore } from "../../../features/auth/store/authStore";

/* ── Logo (giữ custom vì cần gradient riêng) ── */
const LogoIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
  >
    <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
    <path
      d="M8 22L14 10l4 8 3-5 5 9"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="logo-grad"
        x1="0"
        y1="0"
        x2="32"
        y2="32"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#00d9f5" />
        <stop offset="1" stopColor="#00f59b" />
      </linearGradient>
    </defs>
  </svg>
);

const NAV_ITEMS = [
  { label: "Marketplace", to: "/" },
  { label: "Desktop Launcher", to: "/launcher" },
  { label: "A2MaTeX Studio", to: "/studio" },
];

const Header = () => {
  const [search, setSearch] = useState("");

  const user = useAuthStore.getState().user;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Left: logo + nav */}
        <div className={styles.left}>
          <Link to="/" className={styles.logo} aria-label="A2MaTeX home">
            <LogoIcon />
            <span className={styles.logoText}>A2MaTeX</span>
          </Link>

          <nav className={styles.nav} aria-label="Main navigation">
            {NAV_ITEMS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  [styles.navLink, isActive ? styles.navActive : ""]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: search + credits + avatar */}
        <div className={styles.right}>
          <div className={styles.searchWrap}>
            <IoSearchOutline className={styles.searchIcon} size={16} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search by keyword, author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search"
            />
            <kbd className={styles.kbd}>⌘K</kbd>
          </div>

          <div className={styles.credits}>
            <IoCashOutline size={15} />
            <span className={styles.creditsValue}>4,850</span>
            <span className={styles.creditsCurrency}>CR</span>
          </div>

          {!user ? (
            <Link to="/login" className={styles.signInBtn} aria-label="Login">
              Sign In
            </Link>
          ) : (
            <Link to="/profile" className={styles.avatar} aria-label="Profile">
              <IoPersonCircleOutline size={22} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
