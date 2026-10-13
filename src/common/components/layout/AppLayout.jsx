import Header from "./Header";
import styles from "./AppLayout.module.css";

const AppLayout = ({ children }) => (
  <div className={styles.layout}>
    <Header />
    <main className={styles.main}>{children}</main>
  </div>
);

export default AppLayout;
