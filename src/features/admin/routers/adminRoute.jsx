import AdminLayout from "@features/admin/components/layout/AdminLayout";
import PermissionRolePage from "@features/admin/pages/permission-role/pages/PermissionRolePage";
import Violation from "../pages/violations/page/Violation";
import RevenuePayout from "../pages/revenue-payout/page/RevenuePayout";
import AuditLog from "../pages/audit/page/AuditLog";
import ReviewQueue from "../pages/review-queue/page/ReviewQueue";
import {
  MdOutlineAttachMoney,
  MdOutlineBlock,
  MdOutlineRateReview,
  MdOutlineSecurity,
  MdOutlineShield,
} from "react-icons/md";

export default function adminRoutes() {
  const adminRoutes = [
    {
      path: "/admin",
      element: (
        <AdminLayout>
          <div />
        </AdminLayout>
      ),
    },
    {
      label: "Review Queue",
      icon: <MdOutlineRateReview />,
      path: "/admin/review-queue",
      badge: 12,
      badgeType: "danger",
      element: (
        <AdminLayout>
          <ReviewQueue />
        </AdminLayout>
      ),
    },
    {
      label: "Violations",
      icon: <MdOutlineBlock />,
      path: "/admin/violations",
      badge: 5,
      badgeType: "warn",
      element: (
        <AdminLayout>
          <Violation />
        </AdminLayout>
      ),
    },
    {
      label: "Revenue & Payout",
      path: "/admin/revenue",
      icon: <MdOutlineAttachMoney />,
      element: (
        <AdminLayout>
          <RevenuePayout />
        </AdminLayout>
      ),
    },
    {
      label: "Audit & Security Logs",
      icon: <MdOutlineSecurity />,
      path: "/admin/audit",
      element: (
        <AdminLayout>
          <AuditLog />
        </AdminLayout>
      ),
    },
    {
      label: "Roles & Permissions",
      icon: <MdOutlineShield />,
      path: "/admin/permission-role",
      element: (
        <AdminLayout>
          <PermissionRolePage />
        </AdminLayout>
      ),
    },
  ];
  return adminRoutes;
}
