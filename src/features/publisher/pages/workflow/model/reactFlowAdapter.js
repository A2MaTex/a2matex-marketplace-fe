const edgeColor = (sourcePort) => {
  if (sourcePort === "error") return "#ef6a75";
  if (sourcePort === "success") return "#4bd6a4";
  return "#43bfd5";
};

export const toReactFlowNodes = (workflow, definitions, selectedNodeId = null) => {
  const outgoingPorts = new Map();
  for (const edge of workflow.edges) {
    const ports = outgoingPorts.get(edge.sourceNodeId) ?? new Set();
    ports.add(edge.sourcePort);
    outgoingPorts.set(edge.sourceNodeId, ports);
  }

  return workflow.nodes.map((node) => {
    const definition = definitions.get(node.type);
    const editorName = node.editor.name?.trim();
    const persistedPorts = [...(outgoingPorts.get(node.id) ?? [])];
    const outputPorts = [...new Set([...(definition?.outputPorts ?? []), ...persistedPorts])];
    return {
      id: node.id,
      type: "workflowNode",
      position: { x: node.editor.x, y: node.editor.y },
      selected: node.id === selectedNodeId,
      data: {
        label: editorName || definition?.displayName || node.type,
        description: node.editor.description,
        labelMode: node.editor.labelMode ?? "icon-and-name",
        nodeType: node.type,
        category: definition?.category ?? "UNKNOWN",
        disabled: node.disabled ?? false,
        errorPolicy: node.errorPolicy,
        isEntry: node.id === workflow.entryNodeId,
        isTerminal: node.type === "flow.end",
        catalogMissing: !definition,
        outputPorts,
      },
    };
  });
};

export const toReactFlowEdges = (workflow) =>
  workflow.edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceNodeId,
    sourceHandle: edge.sourcePort,
    target: edge.targetNodeId,
    targetHandle: "in",
    type: "smoothstep",
    animated: false,
    style: {
      stroke: edgeColor(edge.sourcePort),
      strokeWidth: 1.45,
    },
  }));
