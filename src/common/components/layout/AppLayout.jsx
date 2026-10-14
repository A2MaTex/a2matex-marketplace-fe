import Header from "./Header";
import styles from "./AppLayout.module.css";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../../features/auth/store/authStore";
import { userApi } from "../../api/user/userApi";

const AppLayout = ({ children }) => {
  const [user, setUser] = useState(useAuthStore.getState().user);

  const loadUserProfile = async () => {
    if (!user) {
      setUser(await userApi.getMyProfile());
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  return (
    <div className={styles.layout}>
      <Header user={user} />
      <main className={styles.main}>{children}</main>
    </div>
  );
};

export default AppLayout;
