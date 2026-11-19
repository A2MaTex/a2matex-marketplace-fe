import { useCallback, useEffect, useState } from "react";
import { publisherProjectApi } from "../../api/project/api";
import { parseProjectDraftEnvelope } from "../model/projectContract";
import { isCanceledRequest, toPublisherError } from "../model/publisherError";

const CACHE_TTL_MS = 30_000;
const draftCache = new Map();

const cachedDraft = (projectId) => {
  const cached = draftCache.get(projectId);
  if (!cached || Date.now() - cached.cachedAt > CACHE_TTL_MS) return null;
  return cached.data;
};

export function useProjectDraft(projectId) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => ({
    projectId: null,
    data: null,
    loading: false,
    error: null,
  }));
  const cached = projectId ? cachedDraft(projectId) : null;

  useEffect(() => {
    if (!projectId) return undefined;

    const controller = new AbortController();
    let active = true;

    const load = async () => {
      const cachedData = cachedDraft(projectId);
      setState({
        projectId,
        data: cachedData,
        loading: !cachedData,
        error: null,
      });
      try {
        const response = await publisherProjectApi.getProjectDraft(projectId, {
          signal: controller.signal,
        });
        const data = parseProjectDraftEnvelope(response.data);
        draftCache.set(projectId, { data, cachedAt: Date.now() });
        if (active) setState({ projectId, data, loading: false, error: null });
      } catch (error) {
        if (!active || isCanceledRequest(error)) return;
        setState({
          projectId,
          data: null,
          loading: false,
          error: toPublisherError(error, "Unable to load this project draft."),
        });
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [projectId, reloadKey]);

  const refetch = useCallback(() => {
    if (projectId) draftCache.delete(projectId);
    setReloadKey((value) => value + 1);
  }, [projectId]);

  if (!projectId) return { data: null, loading: false, error: null, refetch };
  if (cached) return { data: cached, loading: false, error: null, refetch };
  if (state.projectId !== projectId) {
    return { data: null, loading: true, error: null, refetch };
  }
  return { data: state.data, loading: state.loading, error: state.error, refetch };
}

export const clearProjectDraftCache = (projectId) => {
  if (projectId) draftCache.delete(projectId);
  else draftCache.clear();
};
