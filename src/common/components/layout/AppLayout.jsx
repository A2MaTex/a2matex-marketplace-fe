import { useEffect, useState } from "react";
import { useAuthStore } from "@features/auth/store/authStore";
import { userApi } from "@api/user/userApi";
import Header from "@/common/components/layout/Header";
import styles from "@/common/components/layout/AppLayout.module.css";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  const user = useAuthStore((s) => s.user);
  const avatarBlob = useAuthStore((s) => s.avatarBlob);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loaded, setLoaded] = useState(!isAuthenticated || !!user);
  
  useEffect(() => {
    if (loaded || !isAuthenticated) return;

    userApi.getMyProfile().then(
      () => setLoaded(true),
      () => setLoaded(true),
    );
  }, [isAuthenticated, loaded]);

  return (
    <div className={styles.layout}>
      <Header user={user} avatar={avatarBlob} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
