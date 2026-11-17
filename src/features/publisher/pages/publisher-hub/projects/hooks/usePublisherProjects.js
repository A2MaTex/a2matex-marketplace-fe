import { useCallback, useEffect, useState } from "react";
import { publisherProjectApi } from "../../api/project/api";
import { parseProjectPageEnvelope } from "../model/projectContract";
import { isCanceledRequest, toPublisherError } from "../model/publisherError";

const emptyPage = (page, limit) => ({
  items: [],
  page,
  limit,
  totalItems: 0,
  totalPages: 0,
});

export function usePublisherProjects({ page, limit, status }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => ({
    data: emptyPage(page, limit),
    loading: true,
    error: null,
  }));

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const response = await publisherProjectApi.getProjects({
          page,
          limit,
          status,
          signal: controller.signal,
        });
        const data = parseProjectPageEnvelope(response.data);
        if (active) setState({ data, loading: false, error: null });
      } catch (error) {
        if (!active || isCanceledRequest(error)) return;
        setState({
          data: emptyPage(page, limit),
          loading: false,
          error: toPublisherError(error, "Unable to load publisher projects."),
        });
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [limit, page, reloadKey, status]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
