import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ children }) {
  return (
    <div className={styles.shell}>
      <AdminHeader />
      <div className={styles.body}>
        <AdminSidebar />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
