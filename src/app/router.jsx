import { createBrowserRouter } from "react-router-dom";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import Marketplace from "../features/marketplace/pages/Marketplace";
import ProductDetailPage from "../features/marketplace/pages/ProductDetailPage";
import AdminLayout from "../features/admin/components/layout/AdminLayout";
import PermissionRolePage from "../features/admin/permission-role/pages/PermissionRolePage";

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
    path: "/products/:productId",
    element: <ProductDetailPage />,
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
