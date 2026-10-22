import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { IoSearchOutline } from "react-icons/io5";
import { IoCashOutline } from "react-icons/io5";
import { IoPersonCircleOutline } from "react-icons/io5";
import styles from "./Header.module.css";
import Button from "../common/Button";
import logo from "@/assets/logo.svg";
import { Avatar } from "../common/Avatar";

const NAV_ITEMS = [
  { label: "Marketplace", to: "/" },
  { label: "Desktop Launcher", to: "/launcher" },
  { label: "A2MaTeX Studio", to: "/studio" },
  { label: "Admin Hub", to: "/admin/permission-role", isAdminOnly: true },
];

const Header = ({ user, avatar }) => {
  const [search, setSearch] = useState("");

  const checkIsAdmin = () => {
    return user?.roles?.some((role) => role.name === "ADMIN");
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Left: logo + nav */}
        <div className={styles.left}>
          <Link to="/" className={styles.logo} aria-label="A2MaTeX home">
            <img src={logo} height={24} alt="logo" />
            <span className={styles.logoText}>A2MaTeX</span>
          </Link>

          <nav className={styles.nav} aria-label="Main navigation">
            {NAV_ITEMS.map(({ label, to, isAdminOnly }) =>
              isAdminOnly && !checkIsAdmin() ? null : (
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
              ),
            )}
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
          {!!user && (
            <div className={styles.userBox}>
              <span className={styles.usernameText}>
                {user?.fullName || ""}
              </span>
            </div>
          )}

          {!user ? (
            <Button href="/login" size="sm">
              Sign In
            </Button>
          ) : (
            <Link to="/profile" className={styles.avatar} aria-label="Profile">
              {avatar ? (
                <Avatar blob={avatar} />
              ) : (
                <IoPersonCircleOutline size={22} />
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
