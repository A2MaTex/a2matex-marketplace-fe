import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { userApi } from "@api/user/userApi";
import { useAuthStore } from "../store/authStore";
import styles from "./RequireRole.module.css";

export default function RequireRole({ role }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const [profileState, setProfileState] = useState(() =>
    user ? "ready" : "loading",
  );

  useEffect(() => {
    if (user || !isAuthenticated) return;

    let active = true;
    userApi
      .getMyProfile()
      .then(() => {
        if (active) setProfileState("ready");
      })
      .catch(() => {
        if (active) setProfileState("failed");
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated || profileState === "failed") {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  if (!user) {
    return (
      <main className={styles.state} aria-live="polite" aria-busy="true">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Checking administrator access…</p>
      </main>
    );
  }

  const allowed = user.roles?.some((item) => item?.name === role);
  if (!allowed) {
    return (
      <main className={styles.state}>
        <span className={styles.code}>403</span>
        <h1>Administrator access required</h1>
        <p>
          This page is hidden by the client for clarity. The API remains the
          security boundary and will reject unauthorized requests.
        </p>
        <Link to="/">Return to Marketplace</Link>
      </main>
    );
  }

  return <Outlet />;
}
