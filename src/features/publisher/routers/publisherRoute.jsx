import { Navigate } from "react-router-dom";
import PublisherHubLayout from "../components/PublisherHubLayout/PublisherHubLayout";
import ProjectsDraftsPage from "../pages/projects/ProjectsDraftsPage";
import CreateProductPage from "../pages/products/CreateProductPage";
import ProductsOffersPage from "../pages/products/ProductsOffersPage";
import PublisherSectionPlaceholder from "../pages/placeholders/PublisherSectionPlaceholder";
import ProductReleasesPage from "../pages/releases/ProductReleasesPage";
import CreateSubmissionPage from "../pages/submissions/CreateSubmissionPage";
import SubmissionsPage from "../pages/submissions/SubmissionsPage";
import WorkflowWorkspaceRoute from "../pages/workflow/WorkflowWorkspaceRoute";

export default function publisherRoutes() {
  return [
    {
      label: "Publisher Hub",
      path: "/publisher",
      element: <PublisherHubLayout />,
      children: [
        {
          index: true,
          element: <Navigate to="projects" replace />,
        },
        {
          path: "projects",
          element: <ProjectsDraftsPage />,
        },
        {
          path: "projects/:projectId",
          element: <Navigate to="draft" replace />,
        },
        {
          path: "projects/:projectId/draft",
          element: <ProjectsDraftsPage />,
        },
        {
          path: "projects/:projectId/draft/workflows/:workflowKey",
          element: <WorkflowWorkspaceRoute />,
        },
        {
          path: "products",
          element: <ProductsOffersPage />,
        },
        {
          path: "products/new",
          element: <CreateProductPage />,
        },
        {
          path: "products/create",
          element: <CreateProductPage />,
        },
        {
          path: "products/:productId",
          element: <ProductsOffersPage />,
        },
        {
          path: "submissions",
          element: <SubmissionsPage />,
        },
        {
          path: "submissions/new",
          element: <CreateSubmissionPage />,
        },
        {
          path: "submissions/:submissionId",
          element: <SubmissionsPage />,
        },
        {
          path: "releases",
          element: <ProductReleasesPage />,
        },
        {
          path: "releases/:productId",
          element: <ProductReleasesPage />,
        },
        {
          path: "releases/:productId/:releaseId",
          element: <ProductReleasesPage />,
        },
        {
          path: "payment",
          element: (
            <PublisherSectionPlaceholder
              eyebrow="Configuration"
              title="Payment Config"
              description="Publisher payment settings will be connected after their API contract is finalized."
            />
          ),
        },
        {
          path: "statistics",
          element: (
            <PublisherSectionPlaceholder
              eyebrow="Insights"
              title="Summary & Statistics"
              description="Publisher analytics are represented by a route shell for now."
            />
          ),
        },
      ],
    },
  ];
}
