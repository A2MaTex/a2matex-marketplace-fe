import PermissionRolePage from "@features/admin/pages/permission-role/pages/PermissionRolePage";
import Violation from "../pages/violations/page/Violation";
import RevenuePayout from "../pages/revenue-payout/page/RevenuePayout";
import AuditLog from "../pages/audit/page/AuditLog";
import { Navigate } from "react-router-dom";
import AdminSubmissionsPage from "../pages/submission-review/page/AdminSubmissionsPage";
import AdminSubmissionDetailPage from "../pages/submission-review/page/AdminSubmissionDetailPage";
import AdminSubmissionWorkflowPage from "../pages/submission-review/page/AdminSubmissionWorkflowPage";
import TermsPage from "../pages/terms/page/TermsPage";
import LauncherReleasePage from "../pages/launcher-release/page/LauncherReleasePage";
import StudioReleasePage from "../pages/studio-release/page/StudioReleasePage";
import AdminSystemSettingsPage from "../pages/system-settings/page/AdminSystemSettingsPage";
import EntitlementManagementPage from "../pages/entitlements/EntitlementManagementPage";
import UserManage from "../pages/user-manage/page/UserManage";
import UserDetail from "../pages/user-manage/page/UserDetail";
import AdminPublishersPage from "../pages/publisher-moderation/page/AdminPublishersPage";
import AdminPublisherDetailPage from "../pages/publisher-moderation/page/AdminPublisherDetailPage";
import AdminProductsPage from "../pages/product-governance/page/AdminProductsPage";
import AdminProductDetailPage from "../pages/product-governance/page/AdminProductDetailPage";
import AdminProductReleasesPage from "../pages/product-governance/page/AdminProductReleasesPage";
import AdminProductReleaseDetailPage from "../pages/product-governance/page/AdminProductReleaseDetailPage";
import {
  MdOutlineAttachMoney,
  MdOutlineBlock,
  MdOutlineSecurity,
  MdOutlineShield,
  MdOutlineGavel,
  MdOutlineRocketLaunch,
  MdOutlineVpnKey,
  MdOutlineSettings,
} from "react-icons/md";

export default function adminRoutes() {
  const adminRoutes = [
    {
      path: "/admin/users",
      element: <UserManage />,
    },
    {
      path: "/admin/users/:userId",
      element: <UserDetail />,
    },
    {
      path: "/admin/publishers",
      element: <AdminPublishersPage />,
    },
    {
      path: "/admin/publishers/:publisherAccountId",
      element: <AdminPublisherDetailPage />,
    },
    {
      path: "/admin/products",
      element: <AdminProductsPage />,
    },
    {
      path: "/admin/products/:productId",
      element: <AdminProductDetailPage />,
    },
    {
      path: "/admin/products/:productId/releases",
      element: <AdminProductReleasesPage />,
    },
    {
      path: "/admin/products/:productId/releases/:releaseId",
      element: <AdminProductReleaseDetailPage />,
    },
    {
      label: "Entitlements",
      icon: <MdOutlineVpnKey />,
      path: "/admin/entitlements",
      element: <EntitlementManagementPage />,
    },
    {
      path: "/admin/submissions",
      element: <AdminSubmissionsPage />,
    },
    {
      path: "/admin/submissions/:submissionId",
      element: <AdminSubmissionDetailPage />,
    },
    {
      path: "/admin/submissions/:submissionId/workflows/:workflowKey",
      element: <AdminSubmissionWorkflowPage />,
    },
    {
      path: "/admin/review-queue",
      element: <Navigate to="/admin/submissions" replace />,
    },
    {
      label: "Violations",
      icon: <MdOutlineBlock />,
      path: "/admin/violations",
      badge: 5,
      badgeType: "warn",
      element: <Violation />,
    },
    {
      label: "Revenue & Payout",
      path: "/admin/revenue",
      icon: <MdOutlineAttachMoney />,
      element: <RevenuePayout />,
    },
    {
      label: "Audit & Security Logs",
      icon: <MdOutlineSecurity />,
      path: "/admin/audit",
      element: <AuditLog />,
    },
    {
      label: "Roles & Permissions",
      icon: <MdOutlineShield />,
      path: "/admin/permission-role",
      element: <PermissionRolePage />,
    },
    {
      label: "Terms & Policy",
      icon: <MdOutlineGavel />,
      path: "/admin/terms",
      element: <TermsPage />,
    },
    {
      label: "Launcher Releases",
      icon: <MdOutlineRocketLaunch />,
      path: "/admin/launcher-releases",
      element: <LauncherReleasePage />,
    },
    {
      label: "Studio Releases",
      icon: <MdOutlineRocketLaunch />,
      path: "/admin/studio-releases",
      element: <StudioReleasePage />,
    },
    {
      label: "System Settings",
      icon: <MdOutlineSettings />,
      path: "/admin/system-settings",
      element: <AdminSystemSettingsPage />,
    },
  ];
  return adminRoutes;
}
