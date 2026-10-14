import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import styles from "./AdminLayout.module.css";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../../auth/store/authStore";
import { useNavigate } from "react-router-dom";
import { userApi } from "../../../../common/api/user/userApi";

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(useAuthStore.getState().user);
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
      <AdminHeader />
      <div className={styles.body}>
        <AdminSidebar />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
