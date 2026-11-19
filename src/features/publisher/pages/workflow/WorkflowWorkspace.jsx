import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiExternalLink,
  FiGitBranch,
  FiMaximize,
  FiMinimize,
} from "react-icons/fi";
import { Link, useLocation, useParams } from "react-router-dom";
import { useProjectDetails } from "../projects/hooks/useProjectDetails";
import { useProjectDraft } from "../projects/hooks/useProjectDraft";
import WorkflowCanvas from "./WorkflowCanvas";
import NodeDetailDrawer from "./NodeDetailDrawer";
import { useNodeCatalog } from "./hooks/useNodeCatalog";
import { decodeProjectDraft } from "./model/draftDecoder";
import { catalogByType } from "./model/nodeCatalog";
import styles from "./WorkflowWorkspace.module.css";

const decodeState = (draft) => {
  if (!draft) return { data: null, error: null };
  try {
    return { data: decodeProjectDraft(draft), error: null };
  } catch (error) {
    return { data: null, error };
  }
};

const issuesForNode = (validationSummary, nodeId) => {
  const issues = [
    ...(Array.isArray(validationSummary?.errors) ? validationSummary.errors : []),
    ...(Array.isArray(validationSummary?.warnings) ? validationSummary.warnings : []),
  ];
  return issues.filter(
    (issue) => issue?.nodeId === nodeId || (Array.isArray(issue?.path) && issue.path.includes(nodeId)),
  );
};

const WorkspaceState = ({ title, message, backTo }) => (
  <section className={styles.state}>
    <span><FiGitBranch aria-hidden="true" size={22} /></span>
    <h1>{title}</h1>
    <p>{message}</p>
    <Link to={backTo}><FiArrowLeft aria-hidden="true" /> Back to draft</Link>
  </section>
);

const WorkflowWorkspace = () => {
  const workspaceRef = useRef(null);
  const { projectId, workflowKey } = useParams();
  const location = useLocation();
  const projectState = useProjectDetails(projectId);
  const draftState = useProjectDraft(projectId);
  const catalogState = useNodeCatalog();
  const decodedState = useMemo(
    () => decodeState(draftState.data?.draft),
    [draftState.data?.draft],
  );
  const [selection, setSelection] = useState({ workflowKey: null, nodeId: null });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const backTo = `/publisher/projects/${projectId}/draft${location.search}`;

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === workspaceRef.current);
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!workspaceRef.current) return;

    if (document.fullscreenElement === workspaceRef.current) {
      await document.exitFullscreen();
      return;
    }

    await workspaceRef.current.requestFullscreen();
  }, []);

  if (projectState.loading || draftState.loading) {
    return <WorkspaceState title="Loading workflow" message="Reading the latest cloud draft..." backTo={backTo} />;
  }
  if (projectState.error || draftState.error) {
    return (
      <WorkspaceState
        title="Workflow unavailable"
        message={(projectState.error ?? draftState.error).message}
        backTo={backTo}
      />
    );
  }
  if (!draftState.data?.draft) {
    return <WorkspaceState title="No cloud draft" message="This project has no workflow to display." backTo={backTo} />;
  }
  if (decodedState.error || !decodedState.data) {
    return (
      <WorkspaceState
        title="Unsupported workflow"
        message={decodedState.error?.message || "The workflow graph could not be decoded."}
        backTo={backTo}
      />
    );
  }

  const decoded = decodedState.data;
  const workflowEntry =
    decoded.workflows.find((entry) => entry.key === workflowKey) ??
    decoded.workflows.find((entry) => entry.key === decoded.entryWorkflowKey) ??
    decoded.workflows[0];
  const selectedNodeId = selection.workflowKey === workflowEntry.key ? selection.nodeId : null;
  const selectedNode =
    workflowEntry.document.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const definitions = catalogByType(catalogState.data);
  const selectedDefinition = selectedNode ? definitions.get(selectedNode.type) ?? null : null;
  const nodeIssues = selectedNode
    ? issuesForNode(draftState.data.draft.validationSummary, selectedNode.id)
    : [];
  const studioHref = `a2matex-studio://cloud-project/${encodeURIComponent(projectId)}?workflow=${encodeURIComponent(workflowEntry.key)}&action=open`;

  return (
    <section ref={workspaceRef} className={styles.workspace}>
      <header className={styles.toolbar}>
        <Link className={styles.back} to={backTo} aria-label="Back to project draft">
          <FiArrowLeft aria-hidden="true" />
        </Link>
        <div className={styles.title}>
          <span>{projectState.data?.name || "Project workflow"}</span>
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Project workflows">
          {/* {decoded.workflows.map((entry) => (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={entry.key === workflowEntry.key}
              className={entry.key === workflowEntry.key ? styles.activeTab : ""}
              onClick={() => selectWorkflow(entry.key)}
            >
              {entry.label}
            </button>
          ))} */}
        </div>
        <button
          type="button"
          className={styles.fullscreenButton}
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
          title={isFullscreen ? "Exit fullscreen (Esc)" : "Open fullscreen"}
        >
          {isFullscreen ? <FiMinimize aria-hidden="true" /> : <FiMaximize aria-hidden="true" />}
          <span>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</span>
        </button>
        <a className={styles.studioLink} href={studioHref}>
          Open Studio <FiExternalLink aria-hidden="true" />
        </a>
      </header>

      <div className={styles.editor}>
        <div className={styles.canvasWrap}>
          {catalogState.error ? (
            <div className={styles.catalogWarning}>
              Node catalog unavailable. Raw node types are shown.
            </div>
          ) : null}
          <WorkflowCanvas
            graphKey={`${draftState.data.draft.id}:${draftState.data.draft.version}:${draftState.data.draft.contentHash}:${workflowEntry.key}`}
            workflow={workflowEntry.document}
            catalog={catalogState.data}
            selectedNodeId={selectedNodeId}
            onNodeSelect={(nodeId) => setSelection({ workflowKey: workflowEntry.key, nodeId })}
          />
        </div>

        <NodeDetailDrawer
          node={selectedNode}
          definition={selectedDefinition}
          issues={nodeIssues}
          onClose={() => setSelection({ workflowKey: workflowEntry.key, nodeId: null })}
        />
      </div>
    </section>
  );
};

export default WorkflowWorkspace;
