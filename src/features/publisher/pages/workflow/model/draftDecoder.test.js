import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseProjectDraftEnvelope } from "../../projects/model/projectContract.js";
import { decodeProjectDraft, WorkflowDecodeError } from "./draftDecoder.js";
import { toReactFlowEdges, toReactFlowNodes } from "./reactFlowAdapter.js";

const fixture = async (name) => {
  const url = new URL(`../../projects/model/fixtures/${name}`, import.meta.url);
  return JSON.parse(await readFile(fileURLToPath(url), "utf8"));
};

test("decodes the flat draft into a main workflow", async () => {
  const envelope = parseProjectDraftEnvelope(await fixture("flat-draft.json"));
  const decoded = decodeProjectDraft(envelope.draft);

  assert.equal(decoded.format, "flat");
  assert.equal(decoded.entryWorkflowKey, "main");
  assert.equal(decoded.workflows[0].document.nodes.length, 2);
});

test("decodes the legacy bundle into stable route tabs", async () => {
  const envelope = parseProjectDraftEnvelope(await fixture("legacy-bundle-draft.json"));
  const decoded = decodeProjectDraft(envelope.draft);

  assert.equal(decoded.format, "legacy-bundle");
  assert.equal(decoded.entryWorkflowKey, "main");
  assert.equal(decoded.workflows[0].path, "workflows/main.workflow.json");
});

test("rejects an unsupported workflow schema without leaking payload values", async () => {
  const envelope = parseProjectDraftEnvelope(await fixture("invalid-draft.json"));
  assert.throws(
    () => decodeProjectDraft(envelope.draft),
    (error) =>
      error instanceof WorkflowDecodeError &&
      error.code === "UNSUPPORTED_SCHEMA" &&
      !error.message.includes("not-an-array"),
  );
});

test("maps workflow nodes and ports without mutating the document", async () => {
  const envelope = parseProjectDraftEnvelope(await fixture("flat-draft.json"));
  const document = decodeProjectDraft(envelope.draft).workflows[0].document;
  const before = JSON.stringify(document);
  const definitions = new Map([
    ["android.tap", { displayName: "Tap", category: "ANDROID", outputPorts: ["success", "error"] }],
  ]);

  const nodes = toReactFlowNodes(document, definitions, "tap");
  const edges = toReactFlowEdges(document);

  assert.equal(nodes[1].selected, true);
  assert.deepEqual(nodes[0].data.outputPorts, ["out"]);
  assert.equal(edges[0].sourceHandle, "out");
  assert.equal(JSON.stringify(document), before);
});
