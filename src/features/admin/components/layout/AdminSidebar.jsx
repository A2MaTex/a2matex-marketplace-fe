import { NavLink, useNavigate } from "react-router-dom";
import styles from "./AdminSidebar.module.css";
import { FiLogOut } from "react-icons/fi";
import { authApi } from "@/features/auth/api/authApi";
import adminRoutes from "../../routers/adminRoute";

export default function AdminSidebar({ user }) {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await authApi.logout();
    navigate("/");
  };

  const NAV_ITEMS = adminRoutes().filter((e) => !!e.label);

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandTop}>
          <div className={styles.brandDot} />
          <span className={styles.brandName}>CORE CONTROL PLANE</span>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.navSection}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.active : ""]
                .filter(Boolean)
                .join(" ")
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            {item.badge && (
              <span
                className={[
                  styles.navBadge,
                  item.badgeType === "warn" ? styles.warn : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User block */}
      <div className={styles.userBlock}>
        <div className={styles.avatar}>A</div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.fullName || ""}</div>
          <div className={styles.userRole}>ADMIN</div>
        </div>
        <FiLogOut
          onClick={handleLogout}
          className={styles.logOutIcon}
          title="Logout"
        />
      </div>
    </aside>
  );
}
