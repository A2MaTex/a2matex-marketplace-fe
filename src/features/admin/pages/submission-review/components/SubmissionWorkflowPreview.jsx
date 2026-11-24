import { useMemo } from "react";
import { FiArrowUpRight, FiGitBranch } from "react-icons/fi";
import { Link } from "react-router-dom";
import WorkflowCanvas from "@/features/publisher/pages/workflow/WorkflowCanvas";
import {
  decodeSubmissionWorkflowRevision,
  selectSubmissionWorkflow,
} from "../model/adminSubmissionWorkflow";
import JsonInspector from "./JsonInspector";
import styles from "../page/AdminSubmissionReview.module.css";

export default function SubmissionWorkflowPreview({
  revision,
  submissionId,
  catalogState,
}) {
  const decoded = useMemo(() => {
    try {
      return {
        data: decodeSubmissionWorkflowRevision(revision),
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  }, [revision]);

  const workflow = decoded.data
    ? selectSubmissionWorkflow(decoded.data, decoded.data.entryWorkflowKey)
    : null;
  const openTo = workflow
    ? `/admin/submissions/${submissionId}/workflows/${encodeURIComponent(workflow.key)}`
    : null;

  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <span className={styles.panelIcon}><FiGitBranch /></span>
        <div><p>Read-only graph</p><h2>Workflow revision</h2></div>
        <small>Draft v{revision.sourceDraftVersion}</small>
      </header>

      {decoded.error || !workflow ? (
        <div className={styles.workflowFallback} role="alert">
          <strong>Graph preview unavailable</strong>
          <p>{decoded.error?.message || "The frozen graph has no workflow document."}</p>
        </div>
      ) : (
        <div className={styles.workflowPreviewShell}>
          <div className={styles.workflowPreviewBar}>
            <div>
              <span>{workflow.label}</span>
              <small>{workflow.document.nodes.length} nodes · {workflow.document.edges.length} connections</small>
            </div>
            <Link className={styles.openWorkflow} to={openTo}>
              Open full workflow <FiArrowUpRight />
            </Link>
          </div>
          <div className={styles.workflowCanvas}>
            {catalogState.error ? (
              <p className={styles.canvasNotice}>Catalog unavailable; frozen node names are still shown.</p>
            ) : null}
            <WorkflowCanvas
              workflow={workflow.document}
              catalog={catalogState.data}
              graphKey={`${revision.id}:${revision.contentHash}:${workflow.key}`}
              preview
            />
          </div>
        </div>
      )}

      <div className={styles.jsonGrid}>
        <JsonInspector title="Input schema" value={revision.inputSchema} />
        <JsonInspector title="Capability manifest" value={revision.capabilityManifest} />
        <JsonInspector title="Validation summary" value={revision.validationSummary} />
        <JsonInspector title="Node definition manifest" value={revision.nodeDefinitionManifest} />
      </div>
    </section>
  );
}
