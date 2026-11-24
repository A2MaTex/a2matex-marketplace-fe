import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { userApi } from "@api/user/userApi";
import { useAuthStore } from "@features/auth/store/authStore";
import Header from "@/common/components/layout/Header";
import AdminSidebar from "./AdminSidebar";
import styles from "./AdminLayout.module.css";

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const avatarBlob = useAuthStore((s) => s.avatarBlob);
  const [loaded, setLoaded] = useState(!!user);

  const navigate = useNavigate();

  useEffect(() => {
    if (loaded) return;
    userApi
      .getMyProfile()
      .then(() => setLoaded(true))
      .catch(() => navigate("/"));
  }, [loaded, navigate]);

  return (
    <div className={styles.shell}>
      <Header user={user} avatar={avatarBlob} />
      <div className={styles.body}>
        <AdminSidebar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
