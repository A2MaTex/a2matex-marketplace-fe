import { ZodError } from "zod";
import { decodeWorkflowDocument } from "./workflowSchema.js";

export class WorkflowDecodeError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = "WorkflowDecodeError";
    this.code = code;
  }
}

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const routeKeyFor = (path, index, usedKeys) => {
  const base = path
    .split("/")
    .at(-1)
    ?.replace(/\.workflow\.json$/i, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const preferred = base || `workflow-${index + 1}`;
  let key = preferred;
  let suffix = 2;
  while (usedKeys.has(key)) {
    key = `${preferred}-${suffix}`;
    suffix += 1;
  }
  usedKeys.add(key);
  return key;
};

const decodeOrThrow = (value, label) => {
  try {
    return decodeWorkflowDocument(value);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new WorkflowDecodeError(
        "INVALID_WORKFLOW",
        `${label} does not match workflow schema version 1.`,
        { cause: error },
      );
    }
    throw error;
  }
};

export const decodeProjectDraft = (draft) => {
  if (!isObject(draft?.editorGraph)) {
    throw new WorkflowDecodeError("INVALID_DRAFT", "The project draft has no editor graph.");
  }

  const graph = draft.editorGraph;
  if (graph.schemaVersion !== 1) {
    throw new WorkflowDecodeError(
      "UNSUPPORTED_SCHEMA",
      `Workflow schema ${String(graph.schemaVersion)} is not supported by this viewer.`,
    );
  }

  if (!isObject(graph.workflows)) {
    return {
      format: "flat",
      entryWorkflowKey: "main",
      workflows: [
        {
          key: "main",
          path: "workflows/main.workflow.json",
          label: "main",
          document: decodeOrThrow(graph, "The entry workflow"),
        },
      ],
    };
  }

  const entries = Object.entries(graph.workflows);
  if (entries.length === 0) {
    throw new WorkflowDecodeError("INVALID_BUNDLE", "The workflow bundle is empty.");
  }

  const usedKeys = new Set();
  const workflows = entries.map(([path, value], index) => {
    const key = routeKeyFor(path, index, usedKeys);
    return {
      key,
      path,
      label: path.split("/").at(-1)?.replace(/\.workflow\.json$/i, "") || key,
      document: decodeOrThrow(value, `Workflow ${path}`),
    };
  });
  const entryPath = typeof graph.entryWorkflow === "string" ? graph.entryWorkflow : entries[0][0];
  const entryWorkflow = workflows.find((workflow) => workflow.path === entryPath) ?? workflows[0];

  return {
    format: "legacy-bundle",
    entryWorkflowKey: entryWorkflow.key,
    workflows,
  };
};
