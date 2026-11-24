import { useCallback, useEffect, useState } from "react";
import { adminPublisherApi } from "../api/adminPublisherApi";
import { parseAdminPublisherDetailEnvelope } from "../model/adminPublisherContract";
import { toAdminPublisherError } from "../model/adminPublisherError";

export function useAdminPublisherDetail(publisherAccountId) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setState((current) => ({
          data: current.data,
          loading: true,
          error: null,
        }));
      }
    });

    adminPublisherApi
      .detail(publisherAccountId, { signal: controller.signal })
      .then((response) => parseAdminPublisherDetailEnvelope(response.data))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: null,
          loading: false,
          error: toAdminPublisherError(
            error,
            "Unable to load this Publisher account.",
          ),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [publisherAccountId, reloadKey]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
