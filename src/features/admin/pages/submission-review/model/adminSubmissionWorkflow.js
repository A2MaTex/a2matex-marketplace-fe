import { decodeProjectDraft } from "../../../../publisher/pages/workflow/model/draftDecoder.js";

export const decodeSubmissionWorkflowRevision = (revision) =>
  decodeProjectDraft({ editorGraph: revision.editorGraph });

export const selectSubmissionWorkflow = (decoded, workflowKey) =>
  decoded.workflows.find((entry) => entry.key === workflowKey) ??
  decoded.workflows.find((entry) => entry.key === decoded.entryWorkflowKey) ??
  decoded.workflows[0];

export const buildSubmissionNodeIndex = (decoded, catalog) => {
  const definitions = new Map(
    (catalog?.nodes ?? []).map((definition) => [definition.type, definition]),
  );
  const index = new Map();

  for (const workflow of decoded.workflows) {
    for (const node of workflow.document.nodes) {
      const definition = definitions.get(node.type) ?? null;
      const candidate = {
        id: node.id,
        type: node.type,
        name: node.editor.name?.trim() || definition?.displayName || node.type,
        description:
          node.editor.description?.trim() || definition?.description || "",
        workflowKey: workflow.key,
        workflowLabel: workflow.label,
        catalogMissing: !definition,
      };
      const candidates = index.get(node.id) ?? [];
      candidates.push(candidate);
      index.set(node.id, candidates);
    }
  }

  return index;
};

export const resolveSubmissionNode = (index, nodeId) => {
  const candidates = index.get(nodeId) ?? [];
  if (!candidates.length) return null;
  return { ...candidates[0], ambiguous: candidates.length > 1 };
};

export const findingsForSubmissionNode = (findings, nodeId) =>
  findings
    .filter((finding) => finding.nodeId === nodeId)
    .map((finding) => ({ code: finding.code, message: finding.message }));
