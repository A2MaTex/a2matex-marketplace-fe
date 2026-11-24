import { NavLink } from "react-router-dom";
import styles from "./AdminSidebar.module.css";
import {
  FiActivity,
  FiBox,
  FiCreditCard,
  FiFileText,
  FiKey,
  FiLayers,
  FiMonitor,
  FiPackage,
  FiPieChart,
  FiSettings,
  FiShield,
  FiShoppingBag,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        icon: <FiPieChart />,
        status: "API needed",
        disabledReason: "Dashboard metrics require a future aggregate API.",
      },
    ],
  },
  {
    label: "Identity & Access",
    items: [
      {
        label: "User Management",
        icon: <FiUsers />,
        to: "/admin/users",
      },
      {
        label: "Publisher Moderation",
        icon: <FiUserCheck />,
        status: "Planned",
        disabledReason: "The frontend implementation is not built yet.",
      },
      {
        label: "Roles & Permissions",
        icon: <FiShield />,
        to: "/admin/permission-role",
      },
    ],
  },
  {
    label: "Marketplace Governance",
    items: [
      {
        label: "Submission Review",
        icon: <FiLayers />,
        to: "/admin/submissions",
      },
      {
        label: "Product Moderation",
        icon: <FiBox />,
        disabledReason: "The product moderation page is not implemented yet.",
      },
      {
        label: "Product Releases",
        icon: <FiPackage />,
        disabledReason: "The Admin product release page is not implemented yet.",
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        label: "Entitlements",
        icon: <FiKey />,
        disabledReason: "Backend permissions must be seeded before this feature is enabled.",
      },
      {
        label: "Orders",
        icon: <FiShoppingBag />,
        disabledReason: "There is no Admin order API yet.",
      },
      {
        label: "Top-up Transactions",
        icon: <FiCreditCard />,
        disabledReason: "There is no Admin transaction API yet.",
      },
    ],
  },
  {
    label: "Distribution",
    items: [
      {
        label: "Launcher Releases",
        icon: <FiMonitor />,
        to: "/admin/launcher-releases",
      },
      {
        label: "Studio Releases",
        icon: <FiPackage />,
        disabledReason: "Backend permissions must be seeded before this feature is enabled.",
      },
    ],
  },
  {
    label: "Content & Configuration",
    items: [
      {
        label: "Terms & Policy",
        icon: <FiFileText />,
        to: "/admin/terms",
      },
      {
        label: "System Settings",
        icon: <FiSettings />,
        disabledReason: "Backend permissions must be seeded before this feature is enabled.",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Audit Log",
        icon: <FiActivity />,
        disabledReason: "There is no central audit log API yet.",
      },
    ],
  },
];

export default function AdminSidebar() {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav} aria-label="Admin features">
        {NAV_SECTIONS.map((section) => (
          <section className={styles.navSection} key={section.label}>
            <h2 className={styles.sectionLabel}>{section.label}</h2>
            <div className={styles.sectionItems}>
              {section.items.map((item) =>
                item.to ? (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    title={item.label}
                    className={({ isActive }) =>
                      [styles.navItem, isActive ? styles.active : ""]
                        .filter(Boolean)
                        .join(" ")
                    }
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </NavLink>
                ) : (
                  <div
                    key={item.label}
                    className={`${styles.navItem} ${styles.disabled}`}
                    aria-disabled="true"
                    title={item.disabledReason}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </div>
                ),
              )}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}
