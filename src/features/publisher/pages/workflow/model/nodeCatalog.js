export const DEFAULT_RUNTIME_VERSION =
  import.meta.env.VITE_A2MATEX_RUNTIME_VERSION || "0.1.0";

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const parseNodeCatalogEnvelope = (payload) => {
  const data = isObject(payload?.data) ? payload.data : null;
  if (!data || !Array.isArray(data.nodes)) {
    throw new TypeError("The node catalog response is invalid.");
  }

  return {
    catalogHash: typeof data.catalogHash === "string" ? data.catalogHash : null,
    nodes: data.nodes.flatMap((node) => {
      if (!isObject(node) || typeof node.type !== "string" || typeof node.name !== "string") {
        return [];
      }
      return [
        {
          type: node.type,
          displayName: node.name,
          description: typeof node.description === "string" ? node.description : "",
          category: typeof node.category === "string" ? node.category : "UNKNOWN",
          configSchema: isObject(node.configSchema) ? node.configSchema : null,
          inputSchema: isObject(node.inputSchema) ? node.inputSchema : null,
          outputSchema: isObject(node.outputSchema) ? node.outputSchema : null,
          outputPorts: Array.isArray(node.outputPorts?.ports) ? node.outputPorts.ports : [],
          targeting: isObject(node.editorHints?.targeting) ? node.editorHints.targeting : null,
        },
      ];
    }),
  };
};

export const catalogByType = (catalog) =>
  new Map((catalog?.nodes ?? []).map((definition) => [definition.type, definition]));
