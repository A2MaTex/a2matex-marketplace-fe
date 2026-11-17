import { useMemo } from "react";
import WorkflowCanvas from "../workflow/WorkflowCanvas";
import { useNodeCatalog } from "../workflow/hooks/useNodeCatalog";
import { decodeProjectDraft } from "../workflow/model/draftDecoder";
import styles from "./ProjectCanvasPreview.module.css";

const ProjectCanvasPreview = ({ draft }) => {
  const catalogState = useNodeCatalog();
  const decoded = useMemo(() => {
    try {
      return { data: decodeProjectDraft(draft), error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, [draft]);

  if (decoded.error || !decoded.data) {
    return (
      <div className={styles.fallback}>
        <strong>Graph preview unavailable</strong>
        <p>{decoded.error?.message || "The draft could not be decoded."}</p>
      </div>
    );
  }

  const entry =
    decoded.data.workflows.find(
      (workflow) => workflow.key === decoded.data.entryWorkflowKey,
    ) ?? decoded.data.workflows[0];

  return (
    <WorkflowCanvas
      workflow={entry.document}
      catalog={catalogState.data}
      preview
    />
  );
};

export default ProjectCanvasPreview;
