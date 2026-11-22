import { createBrowserRouter } from "react-router-dom";
import LoginPage from "@features/auth/pages/LoginPage";
import RegisterPage from "@features/auth/pages/RegisterPage";
import LauncherPage from "@/features/marketplace/pages/launcher/LauncherPage";
import Marketplace from "@/features/marketplace/pages/home/Marketplace";
import ProductDetailPage from "@/features/marketplace/pages/product-detail/ProductDetailPage";
import PublicPublisherPage from "@/features/marketplace/pages/publisher/PublicPublisherPage";
import StudioPage from "@/features/marketplace/pages/studio/StudioLandingPage";
import ProfilePage from "@features/profile/pages/ProfilePage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import adminRoutes from "@/features/admin/routers/adminRoute";
import AppLayout from "@/common/components/layout/AppLayout";
import AdminLayout from "@/features/admin/components/layout/AdminLayout";
import publisherRoutes from "@/features/publisher/routers/publisherRoute";
import LegalDocumentPage from "@/features/term/pages/LegalDocumentPage";
import TERM_TYPE from "@/constants/term";
import SocialLoginCallbackPage from "@/features/auth/pages/SocialLoginCallbackPage";

export const router = createBrowserRouter([
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
    path: "/auth/google/callback",
    element: <SocialLoginCallbackPage provider="google" />,
  },
  {
    path: "/auth/github/callback",
    element: <SocialLoginCallbackPage provider="github" />,
  },
  {
    // AppLayout mount một lần duy nhất, không bị destroy khi navigate
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Marketplace />,
      },

      {
        path: "/products/:productId",
        element: <ProductDetailPage />,
      },
      {
        path: "/publishers/:username",
        element: <PublicPublisherPage />,
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
      {
        path: "/terms",
        element: (
          <LegalDocumentPage
            key="customer-terms"
            type={TERM_TYPE.CUSTOMER_TERMS}
            fallbackTitle="Terms of Service"
            variant="terms"
          />
        ),
      },
      {
        path: "/privacy",
        element: (
          <LegalDocumentPage
            key="privacy-policy"
            type={TERM_TYPE.PRIVACY_POLICY}
            fallbackTitle="Privacy Policy"
            variant="privacy"
          />
        ),
      },
    ],
  },
  // ── Admin routes ──────────────────────────────────────────
  {
    element: <AdminLayout />,
    children: adminRoutes(),
  },
  // Publisher routes
  {
    element: <AppLayout />,
    children: publisherRoutes(),
  },
]);
