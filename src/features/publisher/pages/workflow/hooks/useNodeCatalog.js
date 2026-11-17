import { useEffect, useState } from "react";
import { publisherNodeCatalogApi } from "../../api/node-catalog/api";
import { isCanceledRequest, toPublisherError } from "../../projects/model/publisherError";
import { DEFAULT_RUNTIME_VERSION, parseNodeCatalogEnvelope } from "../model/nodeCatalog";

const catalogCache = new Map();

export function useNodeCatalog(runtimeVersion = DEFAULT_RUNTIME_VERSION) {
  const cached = catalogCache.get(runtimeVersion) ?? null;
  const [state, setState] = useState({
    runtimeVersion: null,
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (catalogCache.has(runtimeVersion)) return undefined;
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setState({ runtimeVersion, data: null, loading: true, error: null });
      try {
        const response = await publisherNodeCatalogApi.getNodeCatalog({
          runtimeVersion,
          signal: controller.signal,
        });
        const data = parseNodeCatalogEnvelope(response.data);
        catalogCache.set(runtimeVersion, data);
        if (active) setState({ runtimeVersion, data, loading: false, error: null });
      } catch (error) {
        if (!active || isCanceledRequest(error)) return;
        setState({
          runtimeVersion,
          data: null,
          loading: false,
          error: toPublisherError(error, "Unable to load node definitions."),
        });
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [runtimeVersion]);

  if (cached) return { data: cached, loading: false, error: null };
  if (state.runtimeVersion !== runtimeVersion) {
    return { data: null, loading: true, error: null };
  }
  return { data: state.data, loading: state.loading, error: state.error };
}
