import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  PublisherContractError,
  getGraphSummary,
  parseProjectDraftEnvelope,
  parseProjectPageEnvelope,
} from "./projectContract.js";

const fixture = async (name) => {
  const url = new URL(`./fixtures/${name}`, import.meta.url);
  return JSON.parse(await readFile(fileURLToPath(url), "utf8"));
};

test("parses the current flat draft envelope without mutating it", async () => {
  const payload = await fixture("flat-draft.json");
  const before = JSON.stringify(payload);
  const parsed = parseProjectDraftEnvelope(payload);

  assert.equal(parsed.projectStatus, "ACTIVE");
  assert.equal(parsed.draft.version, 3);
  assert.deepEqual(getGraphSummary(parsed.draft), {
    schemaVersion: 1,
    nodeCount: 2,
    edgeCount: 1,
  });
  assert.equal(JSON.stringify(payload), before);
});

test("summarizes the legacy workflow bundle", async () => {
  const payload = await fixture("legacy-bundle-draft.json");
  const parsed = parseProjectDraftEnvelope(payload);

  assert.equal(parsed.projectStatus, "ARCHIVED");
  assert.deepEqual(getGraphSummary(parsed.draft), {
    schemaVersion: 1,
    nodeCount: 0,
    edgeCount: 0,
  });
});

test("keeps unknown node types inside the read-only draft boundary", async () => {
  const payload = await fixture("unknown-node-draft.json");
  const parsed = parseProjectDraftEnvelope(payload);

  assert.equal(parsed.draft.editorGraph.nodes[0].type, "custom.future_node");
  assert.equal(getGraphSummary(parsed.draft).nodeCount, 1);
});

test("accepts a null draft as a valid empty state", () => {
  const parsed = parseProjectDraftEnvelope({
    data: { projectStatus: "ACTIVE", draft: null },
    statusCode: 200,
  });
  assert.deepEqual(parsed, { projectStatus: "ACTIVE", draft: null });
});

test("parses pagination metadata and rejects unsupported statuses", () => {
  const project = {
    id: "project-1",
    publisherAccountId: "publisher-1",
    name: "Project",
    description: null,
    status: "ACTIVE",
    createdAt: "2026-11-17T03:00:00.000Z",
    updatedAt: null,
  };
  const parsed = parseProjectPageEnvelope({
    data: {
      items: [project],
      totalItems: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
    statusCode: 200,
  });
  assert.equal(parsed.items[0].id, "project-1");

  assert.throws(
    () =>
      parseProjectPageEnvelope({
        data: {
          items: [{ ...project, status: "DELETED" }],
          totalItems: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      }),
    PublisherContractError,
  );
});
