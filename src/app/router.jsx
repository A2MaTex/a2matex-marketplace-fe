import { createBrowserRouter } from "react-router-dom";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import Marketplace from "../features/marketplace/pages/Marketplace";
import ProductDetailPage from "../features/marketplace/pages/ProductDetailPage";
import AdminLayout from "../features/admin/components/layout/AdminLayout";
import PermissionRolePage from "../features/admin/permission-role/pages/PermissionRolePage";
import LauncherPage from "../features/marketplace/launcher/LauncherPage";
import ProfilePage from "../features/profile/pages/ProfilePage";
import StudioPage from "../features/marketplace/studio/StudioPage";
import ForgotPasswordPage from "../features/auth/pages/forgot-password/ForgotPasswordPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Marketplace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/auth/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/products/:productId",
    element: <ProductDetailPage />,
  },
  {
    path: "/launcher",
    element: <LauncherPage />,
  },
  {
    path: "/profile",
    element: <ProfilePage />,
  },
  {
    path: "/studio",
    element: <StudioPage />,
  },
  // ── Admin routes ──────────────────────────────────────────
  {
    path: "/admin",
    element: <AdminLayout><div /></AdminLayout>,
  },
  {
    path: "/admin/permission-role",
    element: (
      <AdminLayout>
        <PermissionRolePage />
      </AdminLayout>
    ),
  },
]);
