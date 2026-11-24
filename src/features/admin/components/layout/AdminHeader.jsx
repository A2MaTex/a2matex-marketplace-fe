import { Link } from "react-router-dom";
import { MdSearch, MdNotificationsNone } from "react-icons/md";
import styles from "./AdminHeader.module.css";
import logo from "@/assets/text-logo.svg";
import { Avatar } from "@/common/components/common/Avatar";

export default function AdminHeader({ user, avatar }) {
  return (
    <header className={styles.header}>
      {/* Left: Logo + badge */}
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>
          <img src={logo} height={32} alt="logo" />
        </Link>
      </div>

      {/* Center: Search */}
      <div className={styles.searchWrap}>
        <MdSearch className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Global search (Press '/' to focus)…"
          aria-label="Global search"
        />
        <span className={styles.searchKbd}>/</span>
      </div>

      {/* Right: bell + user */}
      <div className={styles.right}>
        <button className={styles.iconBtn} aria-label="Notifications">
          <MdNotificationsNone size={18} />
          <span className={styles.notifDot} />
        </button>

        <div className={styles.userChip}>
          {avatar ? (
            <Link to={"/profile"} className={styles.avatar}>
              <Avatar blob={avatar} />
            </Link>
          ) : (
            <div className={styles.avatarCircle}>A</div>
          )}
          <div className={styles.userText}>
            <span className={styles.userNameText}>{user?.fullName || ""}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
