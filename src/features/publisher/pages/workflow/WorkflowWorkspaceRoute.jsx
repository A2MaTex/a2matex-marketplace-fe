import { lazy, Suspense } from "react";
import PublisherSectionPlaceholder from "../placeholders/PublisherSectionPlaceholder";

const WorkflowWorkspace = lazy(() => import("./WorkflowWorkspace"));

const WorkflowWorkspaceRoute = () => (
  <Suspense
    fallback={
      <PublisherSectionPlaceholder
        eyebrow="Workflow"
        title="Loading viewer"
        description="Preparing the read-only canvas..."
      />
    }
  >
    <WorkflowWorkspace />
  </Suspense>
);

export default WorkflowWorkspaceRoute;
