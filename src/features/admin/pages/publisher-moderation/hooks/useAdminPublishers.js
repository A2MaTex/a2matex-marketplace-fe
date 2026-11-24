import { useCallback, useEffect, useState } from "react";
import { adminPublisherApi } from "../api/adminPublisherApi";
import { parseAdminPublisherPageEnvelope } from "../model/adminPublisherContract";
import { toAdminPublisherError } from "../model/adminPublisherError";

const emptyPage = (page, pageSize) => ({
  items: [],
  totalItems: 0,
  page,
  pageSize,
  totalPages: 0,
});

export function useAdminPublishers({ query, enabled = true }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => ({
    data: emptyPage(query.page, query.pageSize),
    loading: enabled,
    error: null,
  }));

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() =>
        setState({
          data: emptyPage(query.page, query.pageSize),
          loading: false,
          error: null,
        }),
      );
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setState({
          data: emptyPage(query.page, query.pageSize),
          loading: true,
          error: null,
        });
      }
    });

    adminPublisherApi
      .list({ params: query, signal: controller.signal })
      .then((response) => parseAdminPublisherPageEnvelope(response.data))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: emptyPage(query.page, query.pageSize),
          loading: false,
          error: toAdminPublisherError(
            error,
            "Unable to load Publisher accounts.",
          ),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, query, reloadKey]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
