import { useCallback, useEffect, useState } from "react";
import { publisherProjectApi } from "../../api/project/api";
import { parseProjectPageEnvelope } from "../../projects/model/projectContract";
import { toPublisherError } from "../../projects/model/publisherError";

const PAGE_LIMIT = 100;

export function useEligibleProjects(enabled) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ data: [], loading: false, error: null });

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const projects = [];
        let page = 1;
        let totalPages = 1;
        do {
          const response = await publisherProjectApi.getProjects({
            page,
            limit: PAGE_LIMIT,
            status: "ACTIVE",
            signal: controller.signal,
          });
          const parsed = parseProjectPageEnvelope(response.data);
          projects.push(...parsed.items);
          totalPages = parsed.totalPages;
          page += 1;
        } while (page <= totalPages);

        if (active) setState({ data: projects, loading: false, error: null });
      } catch (error) {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: [],
          loading: false,
          error: toPublisherError(error, "Unable to load eligible projects."),
        });
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, reloadKey]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
