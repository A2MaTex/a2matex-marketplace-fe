import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { userApi } from "@api/user/userApi";
import { useAuthStore } from "@features/auth/store/authStore";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import styles from "./AdminLayout.module.css";

export default function AdminLayout() {
  const user = useAuthStore.getState().user;
  const avatar = useAuthStore.getState().avatarBlob;
  const navigate = useNavigate();

  const loadAdmin = async () => {
    try {
      let fetchUser = user;
      if (!fetchUser) {
        fetchUser = await userApi.getMyProfile();
        setUser(fetchUser);
      }
      if (!fetchUser || !fetchUser.roles.some((item) => item.name === "ADMIN"))
        navigate("/");
    } catch (error) {
      console.error(error);

      navigate("/");
    }
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  return (
    <div className={styles.shell}>
      <AdminHeader user={user} avatar={avatar} />
      <div className={styles.body}>
        <AdminSidebar user={user} />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
