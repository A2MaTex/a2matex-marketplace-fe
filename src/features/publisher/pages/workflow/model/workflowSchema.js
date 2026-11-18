import { z } from "zod";

const jsonRecord = z.record(z.string(), z.json());

export const workflowNodeSchema = z
  .object({
    id: z.string().min(1).max(128),
    type: z.string().min(1).max(128),
    disabled: z.boolean().optional(),
    config: jsonRecord,
    editor: z
      .object({
        x: z.number().finite(),
        y: z.number().finite(),
        name: z.string().max(100).optional(),
        description: z.string().max(20_000).optional(),
        labelMode: z.enum(["icon", "icon-and-name"]).optional(),
      })
      .strict(),
    bindings: z.record(
      z.string(),
      z
        .object({
          kind: z.string().min(1).max(64),
        })
        .catchall(z.json()),
    ),
    errorPolicy: z.enum(["STOP", "ERROR_BRANCH"]),
  })
  .strict();

export const workflowEdgeSchema = z
  .object({
    id: z.string().min(1).max(128),
    sourcePort: z.string().min(1).max(64),
    sourceNodeId: z.string().min(1).max(128),
    targetNodeId: z.string().min(1).max(128),
  })
  .strict();

export const workflowDocumentSchema = z
  .object({
    schemaVersion: z.literal(1),
    entryNodeId: z.string().max(128),
    nodes: z.array(workflowNodeSchema).max(5_000),
    edges: z.array(workflowEdgeSchema).max(10_000),
  })
  .strict();

export const decodeWorkflowDocument = (value) =>
  structuredClone(workflowDocumentSchema.parse(value));
