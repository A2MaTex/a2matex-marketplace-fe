import { useEffect, useState } from "react";
import { publisherProjectApi } from "../../api/project/api";
import { parseProjectEnvelope } from "../model/projectContract";
import { isCanceledRequest, toPublisherError } from "../model/publisherError";

const projectCache = new Map();

export function useProjectDetails(projectId, fallbackProject = null) {
  const [state, setState] = useState(() => ({
    projectId: null,
    data: null,
    loading: false,
    error: null,
  }));
  const cached = projectId ? projectCache.get(projectId) ?? null : null;

  useEffect(() => {
    if (!projectId) return undefined;
    if (fallbackProject) {
      projectCache.set(projectId, fallbackProject);
      return undefined;
    }

    if (projectCache.has(projectId)) return undefined;

    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setState({ projectId, data: null, loading: true, error: null });
      try {
        const response = await publisherProjectApi.getProject(projectId, {
          signal: controller.signal,
        });
        const data = parseProjectEnvelope(response.data);
        projectCache.set(projectId, data);
        if (active) setState({ projectId, data, loading: false, error: null });
      } catch (error) {
        if (!active || isCanceledRequest(error)) return;
        setState({
          projectId,
          data: null,
          loading: false,
          error: toPublisherError(error, "Unable to load this project."),
        });
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [fallbackProject, projectId]);

  if (!projectId) return { data: null, loading: false, error: null };
  if (fallbackProject) return { data: fallbackProject, loading: false, error: null };
  if (cached) return { data: cached, loading: false, error: null };
  if (state.projectId !== projectId) {
    return { data: null, loading: true, error: null };
  }
  return { data: state.data, loading: state.loading, error: state.error };
}
