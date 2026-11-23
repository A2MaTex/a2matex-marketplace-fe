import { Component, lazy, Suspense } from "react";
import {
  FiArchive,
  FiClock,
  FiEdit3,
  FiGitBranch,
  FiRefreshCw,
} from "react-icons/fi";
import { getGraphSummary } from "./model/projectContract";
import styles from "./ProjectDraftOverview.module.css";

const PROJECT_PREVIEW_RETRY_KEY = "project-canvas-preview-import-retried";

const ProjectCanvasPreview = lazy(() =>
  import("./ProjectCanvasPreview")
    .then((module) => {
      try {
        window.sessionStorage.removeItem(PROJECT_PREVIEW_RETRY_KEY);
      } catch {
        // Storage may be disabled; the preview still works without it.
      }
      return module;
    })
    .catch((error) => {
      try {
        if (!window.sessionStorage.getItem(PROJECT_PREVIEW_RETRY_KEY)) {
          window.sessionStorage.setItem(PROJECT_PREVIEW_RETRY_KEY, "1");
          window.location.reload();
          return new Promise(() => {});
        }
        window.sessionStorage.removeItem(PROJECT_PREVIEW_RETRY_KEY);
      } catch {
        // Fall through to the local error boundary if storage is unavailable.
      }
      throw error;
    }),
);

class PreviewLoadBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className={styles.previewError} role="alert">
          <p>Workflow preview could not be loaded.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const formatSavedAt = (value) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const StatePanel = ({ title, description, action }) => (
  <div className={styles.statePanel}>
    <span className={styles.stateIcon} aria-hidden="true">
      <FiGitBranch size={21} />
    </span>
    <h2>{title}</h2>
    <p>{description}</p>
    {action}
  </div>
);

const ProjectHeaderActions = ({ status, onEditProject, onArchiveProject }) => {
  const archived = status === "ARCHIVED";
  return (
    <div className={styles.headerActions}>
      <div className={styles.projectActions}>
        <button
          type="button"
          className={styles.projectActionButton}
          onClick={onEditProject}
          disabled={archived}
          title={archived ? "Archived projects cannot be edited" : "Edit project information"}
        >
          <FiEdit3 aria-hidden="true" /> Edit project
        </button>
        <button
          type="button"
          className={styles.archiveActionButton}
          onClick={onArchiveProject}
          disabled={archived}
          title={archived ? "This project is already archived" : "Archive project"}
        >
          <FiArchive aria-hidden="true" /> {archived ? "Archived" : "Archive"}
        </button>
      </div>
      <span className={`${styles.statusBadge} ${status === "ACTIVE" ? styles.active : styles.archived}`}>
        {status === "ARCHIVED" ? <FiArchive aria-hidden="true" /> : null}
        {status}
      </span>
    </div>
  );
};

const ProjectDraftOverview = ({
  selectedProjectId,
  project,
  projectLoading,
  projectError,
  draftData,
  draftLoading,
  draftError,
  onRetryDraft,
  onOpenWorkflow,
  onEditProject,
  onArchiveProject,
  notice,
}) => {
  if (!selectedProjectId) {
    return (
      <section className={styles.overview}>
        <StatePanel
          title="Select a project"
          description="Choose a project from the directory to inspect its latest cloud draft."
        />
      </section>
    );
  }

  if (projectLoading || draftLoading) {
    return (
      <section className={styles.overview} aria-busy="true" aria-label="Loading project draft">
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonGrid}>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.skeletonCanvas} />
      </section>
    );
  }

  if (projectError || draftError) {
    const error = projectError ?? draftError;
    return (
      <section className={styles.overview}>
        <StatePanel
          title="Draft unavailable"
          description={error.message}
          action={
            draftError ? (
              <button type="button" className={styles.secondaryButton} onClick={onRetryDraft}>
                <FiRefreshCw aria-hidden="true" /> Retry draft
              </button>
            ) : null
          }
        />
      </section>
    );
  }

  const draft = draftData?.draft ?? null;
  const status = project?.status ?? draftData?.projectStatus ?? "UNKNOWN";
  if (!draft) {
    return (
      <section className={styles.overview}>
        <div className={styles.projectHeader}>
          <div>
            <p className={styles.eyebrow}>Selected project</p>
            <h1>{project?.name ?? "Project"}</h1>
            <p className={styles.projectDescription}>
              {project?.description || "No project description"}
            </p>
          </div>
          <ProjectHeaderActions
            status={status}
            onEditProject={onEditProject}
            onArchiveProject={onArchiveProject}
          />
        </div>
        {notice ? <p className={styles.notice} role="status">{notice.message}</p> : null}
        <StatePanel
          title="No cloud draft yet"
          description="This project does not have a synchronized draft yet. Open it in A2MaTeX Studio to create one."
        />
      </section>
    );
  }

  const graph = getGraphSummary(draft);

  return (
    <section className={styles.overview}>
      <div className={styles.projectHeader}>
        <div className={styles.projectTitle}>
          <p className={styles.eyebrow}>Cloud project draft</p>
          <div className={styles.titleRow}>
            <h1>{project?.name ?? "Project"}</h1>
          </div>
          <p className={styles.projectDescription}>
            {project?.description || "No project description"}
          </p>
        </div>
        <ProjectHeaderActions
          status={status}
          onEditProject={onEditProject}
          onArchiveProject={onArchiveProject}
        />
      </div>

      {notice ? <p className={styles.notice} role="status">{notice.message}</p> : null}

      <div className={styles.stats}>
        <article>
          <span>Workflow nodes</span>
          <strong>{graph.nodeCount}</strong>
        </article>
        <article>
          <span>Connections</span>
          <strong>{graph.edgeCount}</strong>
        </article>
        <article>
          <span>Graph schema</span>
          <strong>{graph.schemaVersion ?? "Unknown"}</strong>
        </article>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryHeading}>
          <div>
            <p className={styles.eyebrow}>Workflow summary</p>
            <h2>Draft graph is ready for the viewer</h2>
          </div>
          <button type="button" className={styles.primaryButton} onClick={onOpenWorkflow}>
            <FiGitBranch aria-hidden="true" /> Open workflow tab
          </button>
        </div>

        <div className={styles.graphPreview}>
          <PreviewLoadBoundary>
            <Suspense fallback={<div className={styles.previewLoading}>Preparing graph...</div>}>
              <ProjectCanvasPreview draft={draft} />
            </Suspense>
          </PreviewLoadBoundary>
        </div>

        <dl className={styles.metadata}>
          <div>
            <dt><FiClock aria-hidden="true" /> Last synchronized</dt>
            <dd>{formatSavedAt(draft.savedAt)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
};

export default ProjectDraftOverview;
