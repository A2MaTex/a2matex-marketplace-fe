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
import EntitlementManagementPage from "../pages/entitlements/EntitlementManagementPage";
import UserManage from "../pages/user-manage/page/UserManage";
import UserDetail from "../pages/user-manage/page/UserDetail";
import {
  MdOutlineAttachMoney,
  MdOutlineBlock,
  MdOutlineSecurity,
  MdOutlineShield,
  MdOutlineGavel,
  MdOutlineRocketLaunch,
  MdOutlineVpnKey,
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
  ];
  return adminRoutes;
}
