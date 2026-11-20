import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  IoCashOutline,
  IoPersonCircleOutline,
  IoSearchOutline,
} from "react-icons/io5";
import styles from "./Header.module.css";
import Button from "../common/Button";
import logo from "@/assets/text-logo.svg";
import { Avatar } from "../common/Avatar";
import ROLE from "@/constants/roles";

const NAV_ITEMS = [
  { label: "Marketplace", to: "/" },
  { label: "Desktop Launcher", to: "/launcher" },
  { label: "A2MaTeX Studio", to: "/studio" },
];

const ADMIN_ITEMS = [{ label: "Admin Hub", to: "/admin/permission-role" }];
const PUBLISHER_ITEMS = [
  {
    label: "Publisher Hub",
    to: "/publisher/projects",
  },
];

const Header = ({ user, avatar }) => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const submitSearch = (event) => {
    event.preventDefault();
    const query = search.trim().slice(0, 100);
    navigate(query ? `/?q=${encodeURIComponent(query)}` : "/");
  };

  const getDisplayNavItems = () => {
    let displayNavItems = NAV_ITEMS;

    if (!user) return displayNavItems;

    const checkIsAdmin = user?.roles?.some((role) => role.name === ROLE.ADMIN);

    const checkIsPublisher = user?.roles?.some(
      (role) => role.name === ROLE.PUBLISHER,
    );

    if (checkIsAdmin) displayNavItems = [...displayNavItems, ...ADMIN_ITEMS];
    if (checkIsPublisher)
      displayNavItems = [...displayNavItems, ...PUBLISHER_ITEMS];
    return displayNavItems;
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link to="/" className={styles.logo} aria-label="A2MaTeX home">
            <img src={logo} alt="A2MaTeX" />
          </Link>

          <nav className={styles.nav} aria-label="Main navigation">
            {getDisplayNavItems().map(({ to, label }) => (
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

        <div className={styles.right}>
          <form
            className={styles.searchWrap}
            role="search"
            onSubmit={submitSearch}
          >
            <span className={styles.searchIcon} aria-hidden="true">
              <IoSearchOutline />
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={100}
              aria-label="Search marketplace products"
            />
            <kbd className={styles.kbd} aria-label="Press Enter to search">
              ↵
            </kbd>
          </form>

          <div className={styles.credits} title="Available credits">
            <span className={styles.creditsIcon} aria-hidden="true">
              <IoCashOutline />
            </span>
            <span className={styles.creditsValue}>
              {Number(user?.balance ?? 0).toLocaleString("vi-VN")}
            </span>
            <span className={styles.creditsCurrency}>CR</span>
          </div>

          {!user ? (
            <Button href="/login" size="sm">
              Sign In
            </Button>
          ) : (
            <Link
              to="/profile"
              className={styles.profile}
              aria-label="Open profile"
            >
              <span className={styles.userBox}>
                <small>Account</small>
                <strong className={styles.usernameText}>
                  {user.fullName || "A2MaTeX user"}
                </strong>
              </span>
              <span className={styles.avatar}>
                {avatar ? <Avatar blob={avatar} /> : <IoPersonCircleOutline />}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
