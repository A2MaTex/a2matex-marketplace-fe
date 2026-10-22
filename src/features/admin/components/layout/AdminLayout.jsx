import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { userApi } from "@api/user/userApi";
import { useAuthStore } from "@features/auth/store/authStore";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import styles from "./AdminLayout.module.css";

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const [loaded, setLoaded] = useState(!!user);

  const navigate = useNavigate();

  useEffect(() => {
    if (loaded) return;
    userApi
      .getMyProfile()
      .then(() => setLoaded(true))
      .catch((e) => navigate("/"));
  }, []);

  return (
    <div className={styles.shell}>
      <AdminHeader user={user} avatar={user?.imgBlob || null} />
      <div className={styles.body}>
        <AdminSidebar user={user} />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
