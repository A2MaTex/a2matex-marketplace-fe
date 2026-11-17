import { NavLink, Outlet } from "react-router-dom";
import {
  FiActivity,
  FiBox,
  FiCreditCard,
  FiGitBranch,
  FiLayers,
  FiPackage,
} from "react-icons/fi";
import styles from "./PublisherHubLayout.module.css";

const navigationGroups = [
  {
    label: "Tool pipeline",
    items: [
      { label: "Projects & Drafts", to: "projects", icon: FiGitBranch },
      { label: "Products & Offers", to: "products", icon: FiBox },
      { label: "Submissions & Scans", to: "submissions", icon: FiLayers },
    ],
  },
  {
    label: "Deployment & ops",
    items: [{ label: "Release Versions", to: "releases", icon: FiPackage }],
  },
  {
    label: "Config & logs",
    items: [
      { label: "Payment Config", to: "payment", icon: FiCreditCard },
      { label: "Summary & Statistics", to: "statistics", icon: FiActivity },
    ],
  },
];

const PublisherHubLayout = () => (
  <div className={styles.shell}>
    <aside className={styles.sidebar} aria-label="Publisher Hub navigation">
      <nav className={styles.navigation}>
        {navigationGroups.map((group) => (
          <div className={styles.group} key={group.label}>
            <p className={styles.groupLabel}>{group.label}</p>
            <div className={styles.groupItems}>
              {group.items.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                  }
                >
                  <Icon aria-hidden="true" size={17} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>

    <main className={styles.content}>
      <Outlet />
    </main>
  </div>
);

export default PublisherHubLayout;
