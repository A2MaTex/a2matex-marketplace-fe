import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import WorkflowNode from "./WorkflowNode";
import { catalogByType } from "./model/nodeCatalog";
import { toReactFlowEdges, toReactFlowNodes } from "./model/reactFlowAdapter";
import styles from "./WorkflowCanvas.module.css";

const nodeTypes = { workflowNode: WorkflowNode };

const WorkflowCanvas = ({
  workflow,
  catalog,
  selectedNodeId = null,
  onNodeSelect,
  preview = false,
}) => {
  const definitions = useMemo(() => catalogByType(catalog), [catalog]);
  const nodes = useMemo(
    () => toReactFlowNodes(workflow, definitions, selectedNodeId),
    [definitions, selectedNodeId, workflow],
  );
  const edges = useMemo(() => toReactFlowEdges(workflow), [workflow]);

  return (
    <div className={`${styles.canvas} ${preview ? styles.preview : ""}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: preview ? 0.2 : 0.3, maxZoom: preview ? 1.1 : 1.35 }}
        minZoom={0.18}
        maxZoom={1.8}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={!preview}
        nodesFocusable={!preview}
        edgesFocusable={false}
        deleteKeyCode={null}
        panOnDrag={!preview}
        zoomOnScroll={!preview}
        zoomOnPinch={!preview}
        zoomOnDoubleClick={false}
        onNodeClick={(_, node) => {
          if (!preview) onNodeSelect?.(node.id);
        }}
        onPaneClick={() => {
          if (!preview) onNodeSelect?.(null);
        }}
        proOptions={{ hideAttribution: true }}
        aria-label={preview ? "Workflow graph preview" : "Read-only workflow graph"}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.35} color="#28506e" />
        {!preview ? (
          <>
            <MiniMap
              pannable
              zoomable
              nodeColor="#3dbed5"
              maskColor="rgba(5, 9, 15, 0.7)"
              className={styles.minimap}
            />
            <Controls showInteractive={false} className={styles.controls} />
          </>
        ) : null}
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;
