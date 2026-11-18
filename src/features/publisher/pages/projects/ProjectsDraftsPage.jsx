import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { publisherProjectApi } from "../api/project/api";
import ProjectActionDialog from "./ProjectActionDialog";
import ProjectDirectoryPane from "./ProjectDirectoryPane";
import ProjectDraftOverview from "./ProjectDraftOverview";
import { useProjectDetails } from "./hooks/useProjectDetails";
import { useProjectDraft } from "./hooks/useProjectDraft";
import { usePublisherProjects } from "./hooks/usePublisherProjects";
import { toPublisherError } from "./model/publisherError";
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
  const [projectOverride, setProjectOverride] = useState(null);
  const [projectAction, setProjectAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);
  const page = positivePage(searchParams.get("page"));
  const requestedStatus = searchParams.get("status") ?? "";
  const status = VALID_STATUSES.has(requestedStatus) ? requestedStatus : "ACTIVE";

  const projectsState = usePublisherProjects({ page, limit: PAGE_SIZE, status });
  const selectedFromPage =
    projectsState.data.items.find((project) => project.id === projectId) ?? null;
  const projectState = useProjectDetails(projectId, selectedFromPage);
  const draftState = useProjectDraft(projectId);
  const selectedProject =
    projectOverride?.id === projectId ? projectOverride : projectState.data;

  const updateQuery = (nextPage, nextStatus = status) => {
    const next = new URLSearchParams();
    if (nextPage > 1) next.set("page", String(nextPage));
    if (nextStatus) next.set("status", nextStatus);
    setSearchParams(next);
  };

  const handleProjectSelect = (nextProjectId) => {
    navigate({
      pathname: `/publisher/projects/${nextProjectId}/draft`,
      search: searchParams.toString(),
    });
  };

  const handleOpenWorkflow = () => {
    if (!projectId) return;
    const query = searchParams.toString();
    const path = `/publisher/projects/${projectId}/draft/workflows/main`;
    const url = new URL(`${path}${query ? `?${query}` : ""}`, window.location.origin);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openProjectAction = (action) => {
    if (!selectedProject || selectedProject.status !== "ACTIVE") return;
    setActionError(null);
    setProjectAction(action);
  };

  const closeProjectAction = () => {
    if (actionBusy) return;
    setProjectAction(null);
    setActionError(null);
  };

  const handleSaveProject = async (input) => {
    if (!selectedProject) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await publisherProjectApi.updateProject(selectedProject.id, input);
      setProjectOverride({
        ...selectedProject,
        ...input,
        updatedAt: new Date().toISOString(),
      });
      setNotice({
        projectId: selectedProject.id,
        type: "success",
        message: "Project information updated.",
      });
      setProjectAction(null);
      projectsState.refetch();
    } catch (error) {
      setActionError(toPublisherError(error, "Unable to update this project."));
    } finally {
      setActionBusy(false);
    }
  };

  const handleArchiveProject = async () => {
    if (!selectedProject) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await publisherProjectApi.archiveProject(selectedProject.id);
      setProjectOverride({
        ...selectedProject,
        status: "ARCHIVED",
        updatedAt: new Date().toISOString(),
      });
      setNotice({
        projectId: selectedProject.id,
        type: "success",
        message: "Project archived. Its draft remains available in read-only mode.",
      });
      setProjectAction(null);
      projectsState.refetch();
      draftState.refetch();
    } catch (error) {
      setActionError(toPublisherError(error, "Unable to archive this project."));
    } finally {
      setActionBusy(false);
    }
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
        project={selectedProject}
        projectLoading={projectState.loading}
        projectError={projectState.error}
        draftData={draftState.data}
        draftLoading={draftState.loading}
        draftError={draftState.error}
        onRetryDraft={draftState.refetch}
        onOpenWorkflow={handleOpenWorkflow}
        onEditProject={() => openProjectAction("edit")}
        onArchiveProject={() => openProjectAction("archive")}
        notice={notice?.projectId === projectId ? notice : null}
      />

      {projectAction && selectedProject ? (
        <ProjectActionDialog
          key={`${selectedProject.id}:${projectAction}`}
          mode={projectAction}
          project={selectedProject}
          busy={actionBusy}
          error={actionError}
          onClose={closeProjectAction}
          onSave={handleSaveProject}
          onArchive={handleArchiveProject}
        />
      ) : null}
    </div>
  );
};

export default ProjectsDraftsPage;
