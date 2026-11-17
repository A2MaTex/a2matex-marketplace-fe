import { Navigate } from "react-router-dom";
import PublisherHubLayout from "../components/PublisherHubLayout/PublisherHubLayout";
import ProjectsDraftsPage from "../pages/publisher-hub/projects/ProjectsDraftsPage";
import PublisherSectionPlaceholder from "../pages/publisher-hub/placeholders/PublisherSectionPlaceholder";
import WorkflowWorkspaceRoute from "../pages/publisher-hub/workflow/WorkflowWorkspaceRoute";

export default function publisherRoutes() {
  return [
    {
      label: "Publisher Hub",
      path: "/publisher/publisher-hub",
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
          element: (
            <PublisherSectionPlaceholder
              eyebrow="Catalog"
              title="Products & Offers"
              description="Product packaging and offer management will live in this section."
            />
          ),
        },
        {
          path: "submissions",
          element: (
            <PublisherSectionPlaceholder
              eyebrow="Trust & safety"
              title="Submissions & Scans"
              description="Submission review and scan results are not part of the current delivery phase."
            />
          ),
        },
        {
          path: "releases",
          element: (
            <PublisherSectionPlaceholder
              eyebrow="Deployment"
              title="Release Versions"
              description="Release history and promotion controls will be added in a later phase."
            />
          ),
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
