import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProjectUpdateInput,
  ProjectMutationValidationError,
} from "./projectMutation.js";

test("normalizes project update input", () => {
  assert.deepEqual(
    buildProjectUpdateInput({ name: "  Checkout flow  ", description: "  Android  " }),
    { name: "Checkout flow", description: "Android" },
  );
});

test("uses null to clear an empty project description", () => {
  assert.deepEqual(
    buildProjectUpdateInput({ name: "Project", description: "   " }),
    { name: "Project", description: null },
  );
});

test("rejects an empty project name", () => {
  assert.throws(
    () => buildProjectUpdateInput({ name: "  ", description: "" }),
    ProjectMutationValidationError,
  );
});

test("enforces project field length limits", () => {
  assert.throws(
    () => buildProjectUpdateInput({ name: "a".repeat(256), description: "" }),
    /255/,
  );
  assert.throws(
    () => buildProjectUpdateInput({ name: "Project", description: "a".repeat(4001) }),
    /4,000/,
  );
});
