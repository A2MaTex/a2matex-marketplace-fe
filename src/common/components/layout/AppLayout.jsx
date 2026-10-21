import { useEffect, useState } from "react";
import { useAuthStore } from "@features/auth/store/authStore";
import { userApi } from "@api/user/userApi";
import Header from "@/common/components/layout/Header";
import styles from "@/common/components/layout/AppLayout.module.css";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  const user = useAuthStore((s) => s.user);
  const avatar = useAuthStore((s) => s.avatarBlob);
  const [loaded, setLoaded] = useState(!!user);

  useEffect(() => {
    if (loaded) return;
    userApi.getMyProfile().then(() => setLoaded(true));
  }, []);

  return (
    <div className={styles.layout}>
      <Header user={user} avatar={avatar} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
