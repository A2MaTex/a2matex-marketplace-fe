import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiLock,
  FiMaximize,
  FiMinimize,
} from "react-icons/fi";
import { Link, useParams, useSearchParams } from "react-router-dom";
import NodeDetailDrawer from "@/features/publisher/pages/workflow/NodeDetailDrawer";
import WorkflowCanvas from "@/features/publisher/pages/workflow/WorkflowCanvas";
import { useNodeCatalog } from "@/features/publisher/pages/workflow/hooks/useNodeCatalog";
import { catalogByType } from "@/features/publisher/pages/workflow/model/nodeCatalog";
import { useAdminSubmission } from "../hooks/useAdminSubmission";
import { isSubmissionUuid } from "../model/adminSubmissionQuery";
import {
  decodeSubmissionWorkflowRevision,
  findingsForSubmissionNode,
  selectSubmissionWorkflow,
} from "../model/adminSubmissionWorkflow";
import styles from "./AdminSubmissionWorkflowPage.module.css";

const WorkspaceState = ({ icon, title, message, backTo }) => (
  <section className={styles.state} role="status">
    <span>{icon}</span>
    <h1>{title}</h1>
    <p>{message}</p>
    <Link to={backTo}><FiArrowLeft /> Back to submission</Link>
  </section>
);

export default function AdminSubmissionWorkflowPage() {
  const workspaceRef = useRef(null);
  const { submissionId, workflowKey } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const detail = useAdminSubmission(submissionId);
  const catalogState = useNodeCatalog();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const backTo = `/admin/submissions/${submissionId}`;

  const decoded = useMemo(() => {
    if (!detail.data) return { data: null, error: null };
    try {
      return {
        data: decodeSubmissionWorkflowRevision(detail.data.workflowRevision),
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  }, [detail.data]);

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
    } else {
      await workspaceRef.current.requestFullscreen();
    }
  }, []);

  if (!isSubmissionUuid(submissionId)) {
    return <WorkspaceState icon={<FiAlertTriangle />} title="Invalid submission" message="The submission identifier is not a valid UUID." backTo="/admin/submissions" />;
  }

  if (detail.loading && !detail.data) {
    return <WorkspaceState icon={<span className={styles.spinner} />} title="Loading frozen workflow" message="Reading the immutable workflow revision…" backTo={backTo} />;
  }

  if (detail.error || !detail.data) {
    return <WorkspaceState icon={<FiAlertTriangle />} title="Workflow unavailable" message={detail.error?.message || "The submission evidence could not be loaded."} backTo={backTo} />;
  }

  if (decoded.error || !decoded.data) {
    return <WorkspaceState icon={<FiAlertTriangle />} title="Unsupported workflow" message={decoded.error?.message || "The frozen editor graph could not be decoded."} backTo={backTo} />;
  }

  const submission = detail.data;
  const workflow = selectSubmissionWorkflow(decoded.data, workflowKey);
  const requestedNodeId = searchParams.get("node");
  const selectedNode = workflow.document.nodes.find((node) => node.id === requestedNodeId) ?? null;
  const selectedDefinition = selectedNode
    ? catalogByType(catalogState.data).get(selectedNode.type) ?? null
    : null;
  const nodeIssues = selectedNode
    ? findingsForSubmissionNode(submission.scanResult?.findings ?? [], selectedNode.id)
    : [];

  const selectNode = (nodeId) => {
    const next = new URLSearchParams(searchParams);
    if (nodeId) next.set("node", nodeId);
    else next.delete("node");
    setSearchParams(next, { replace: true });
  };

  return (
    <section ref={workspaceRef} className={styles.workspace}>
      <header className={styles.toolbar}>
        <Link className={styles.back} to={backTo} aria-label="Back to submission evidence">
          <FiArrowLeft />
        </Link>
        <div className={styles.title}>
          <h1>{submission.productSnapshot.name}</h1>
          <small>Submission #{submission.number} · Draft v{submission.workflowRevision.sourceDraftVersion}</small>
        </div>
        <span className={styles.readOnly}><FiLock /> Frozen evidence</span>
        <nav className={styles.tabs} aria-label="Frozen workflows">
          {decoded.data.workflows.map((entry) => (
            <Link
              key={entry.key}
              className={entry.key === workflow.key ? styles.activeTab : ""}
              to={`/admin/submissions/${submissionId}/workflows/${encodeURIComponent(entry.key)}`}
            >
              {entry.label}
            </Link>
          ))}
        </nav>
        <button type="button" className={styles.fullscreenButton} onClick={toggleFullscreen}>
          {isFullscreen ? <FiMinimize /> : <FiMaximize />}
          <span>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</span>
        </button>
      </header>

      <div className={styles.editor}>
        <div className={styles.canvasWrap}>
          {catalogState.error ? (
            <div className={styles.catalogWarning}>Node catalog unavailable. Frozen names and raw types are shown.</div>
          ) : null}
          <WorkflowCanvas
            graphKey={`${submission.workflowRevision.id}:${submission.workflowRevision.contentHash}:${workflow.key}`}
            workflow={workflow.document}
            catalog={catalogState.data}
            selectedNodeId={selectedNode?.id ?? null}
            onNodeSelect={selectNode}
          />
        </div>
        <NodeDetailDrawer
          node={selectedNode}
          definition={selectedDefinition}
          issues={nodeIssues}
          onClose={() => selectNode(null)}
        />
      </div>
    </section>
  );
}
