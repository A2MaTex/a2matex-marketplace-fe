import { createBrowserRouter } from "react-router-dom";

import AdminLayout from "@features/admin/components/layout/AdminLayout";
import PermissionRolePage from "@features/admin/pages/permission-role/pages/PermissionRolePage";
import LoginPage from "@features/auth/pages/LoginPage";
import RegisterPage from "@features/auth/pages/RegisterPage";
import LauncherPage from "@/features/marketplace/pages/launcher/LauncherPage";
import Marketplace from "@/features/marketplace/pages/home/Marketplace";
import ProductDetailPage from "@/features/marketplace/pages/product-detail/ProductDetailPage";
import StudioPage from "@/features/marketplace/pages/studio/StudioPage";
import ProfilePage from "@features/profile/pages/ProfilePage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";

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
    element: (
      <AdminLayout>
        <div />
      </AdminLayout>
    ),
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
