import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ProjectDirectoryPane from "./ProjectDirectoryPane";
import ProjectDraftOverview from "./ProjectDraftOverview";
import { useProjectDetails } from "./hooks/useProjectDetails";
import { useProjectDraft } from "./hooks/useProjectDraft";
import { usePublisherProjects } from "./hooks/usePublisherProjects";
import styles from "./ProjectsDraftsPage.module.css";

const PAGE_SIZE = 10;
const VALID_STATUSES = new Set(["ACTIVE", "ARCHIVED"]);

const positivePage = (value) => {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const ProjectsDraftsPage = () => {
  const { projectId = null } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const page = positivePage(searchParams.get("page"));
  const requestedStatus = searchParams.get("status") ?? "";
  const status = VALID_STATUSES.has(requestedStatus) ? requestedStatus : "";

  const projectsState = usePublisherProjects({ page, limit: PAGE_SIZE, status });
  const selectedFromPage =
    projectsState.data.items.find((project) => project.id === projectId) ?? null;
  const projectState = useProjectDetails(projectId, selectedFromPage);
  const draftState = useProjectDraft(projectId);

  const updateQuery = (nextPage, nextStatus = status) => {
    const next = new URLSearchParams();
    if (nextPage > 1) next.set("page", String(nextPage));
    if (nextStatus) next.set("status", nextStatus);
    setSearchParams(next);
  };

  const handleProjectSelect = (nextProjectId) => {
    navigate({
      pathname: `/publisher/publisher-hub/projects/${nextProjectId}/draft`,
      search: searchParams.toString(),
    });
  };

  const handleOpenWorkflow = () => {
    if (!projectId) return;
    const query = searchParams.toString();
    const path = `/publisher/publisher-hub/projects/${projectId}/draft/workflows/main`;
    const url = new URL(`${path}${query ? `?${query}` : ""}`, window.location.origin);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.page}>
      <ProjectDirectoryPane
        projects={projectsState.data.items}
        page={projectsState.data.page}
        totalItems={projectsState.data.totalItems}
        totalPages={projectsState.data.totalPages}
        loading={projectsState.loading}
        error={projectsState.error}
        search={search}
        status={status}
        selectedProjectId={projectId}
        onSearchChange={setSearch}
        onStatusChange={(nextStatus) => updateQuery(1, nextStatus)}
        onProjectSelect={handleProjectSelect}
        onPageChange={(nextPage) => updateQuery(nextPage)}
        onRetry={projectsState.refetch}
      />

      <ProjectDraftOverview
        selectedProjectId={projectId}
        project={projectState.data}
        projectLoading={projectState.loading}
        projectError={projectState.error}
        draftData={draftState.data}
        draftLoading={draftState.loading}
        draftError={draftState.error}
        onRetryDraft={draftState.refetch}
        onOpenWorkflow={handleOpenWorkflow}
      />
    </div>
  );
};

export default ProjectsDraftsPage;
