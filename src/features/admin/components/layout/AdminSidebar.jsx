import { NavLink } from "react-router-dom";
import {
  MdOutlineRateReview,
  MdOutlineBlock,
  MdOutlineAttachMoney,
  MdOutlinePeople,
  MdOutlineSecurity,
  MdOutlineShield,
} from "react-icons/md";
import styles from "./AdminSidebar.module.css";

const NAV_ITEMS = [
  {
    label: "Review Queue",
    to: "/admin/review-queue",
    icon: <MdOutlineRateReview />,
    badge: 12,
    badgeType: "danger",
  },
  {
    label: "Violations",
    to: "/admin/violations",
    icon: <MdOutlineBlock />,
    badge: 5,
    badgeType: "warn",
  },
  {
    label: "Revenue & Payout",
    to: "/admin/revenue",
    icon: <MdOutlineAttachMoney />,
  },
  {
    label: "User & Publisher",
    to: "/admin/users",
    icon: <MdOutlinePeople />,
  },
  {
    label: "Audit & Security Logs",
    to: "/admin/audit",
    icon: <MdOutlineSecurity />,
  },
  {
    label: "Permission & Rights",
    to: "/admin/permission-role",
    icon: <MdOutlineShield />,
  },
];

export default function AdminSidebar({ user }) {
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
            key={item.to}
            to={item.to}
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
      </div>
    </aside>
  );
}
